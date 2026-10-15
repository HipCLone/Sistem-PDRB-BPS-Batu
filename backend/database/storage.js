const {AsyncLocalStorage}=require('async_hooks');
const {flatten,restore}=require('./model');
const {loadRows,writeChanges,lockWrites}=require('./repository');

function createPostgresStorage(pool){
  const context=new AsyncLocalStorage();
  let cached;
  const revision=async client=>(await client.query("SELECT data FROM pdrb.app_metadata WHERE key='revision'")).rows[0]?.data;
  const current=()=>{const state=context.getStore();if(!state||!state.active)throw new Error('Transaksi database tidak aktif.');return state;};
  const proxy=key=>new Proxy({}, {
    get:(_,name)=>current()[key][name],
    set:(_,name,value)=>{current()[key][name]=value;return true;},
    ownKeys:()=>Reflect.ownKeys(current()[key]),
    getOwnPropertyDescriptor:(_,name)=>({value:current()[key][name],enumerable:true,configurable:true})
  });
  async function transaction(write,work){
    const client=await pool.connect();
    let begun=false;
    try{
      await client.query(write?'BEGIN':'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');begun=true;
      await client.query("SET LOCAL lock_timeout='10s'");
      await client.query("SET LOCAL statement_timeout='30s'");
      if(write)await lockWrites(client);
      const version=await revision(client);
      let snapshot;
      if(version&&cached?.version===version)snapshot=structuredClone(cached.snapshot);
      else{
        const rows=await loadRows(client);snapshot={rows,...restore(rows)};
        if(version)cached={version,snapshot:structuredClone(snapshot)};
      }
      const {rows,...values}=snapshot,state={...values,cache:new Map(),dirty:false,active:true};
      return await context.run(state,async()=>{
        try{
          const result=await work(state);
          let updated;
          if(state.dirty){
            if(!write)throw new Error('Perubahan tidak diizinkan pada transaksi baca.');
            const after=flatten(state.seed,state.db);await writeChanges(client,rows,after);
            updated={version:await revision(client),snapshot:{rows:after,...restore(after)}};
          }
          await client.query('COMMIT');begun=false;
          if(updated?.version)cached=updated;
          return result;
        }finally{state.active=false;}
      });
    }catch(error){if(begun)await client.query('ROLLBACK').catch(()=>{});throw error;}
    finally{client.release();}
  }
  const middleware=()=>async(req,res,next)=>{
    const originalJson=res.json.bind(res);
    let originalBody,status,closed=false;
    try{
      await transaction(!['GET','HEAD'].includes(req.method),()=>new Promise((resolve,reject)=>{
        const onClose=()=>{closed=true;reject(new Error('Permintaan terputus sebelum transaksi selesai.'));};
        if(res.destroyed){onClose();return;}
        res.once('close',onClose);
        res.json=body=>{
          if(originalBody!==undefined)return res;
          originalBody=body;status=res.statusCode;res.removeListener('close',onClose);
          if(status>=400)reject(Object.assign(new Error('HTTP request rejected'),{responseBody:body,status}));else resolve();
          return res;
        };
        next();
      }));
      if(!closed&&!res.destroyed){res.json=originalJson;originalJson(originalBody);}
    }catch(error){
      res.json=originalJson;
      if(closed||res.destroyed||res.headersSent)return;
      if(error.responseBody){res.status(error.status);originalJson(error.responseBody);return;}
      console.error('Transaksi PostgreSQL gagal:',error.code||error.name);
      res.removeHeader('Content-Length');res.removeHeader('ETag');
      res.status(503);originalJson({message:'Database belum tersedia atau perubahan belum tersimpan. Periksa koneksi PostgreSQL dan coba lagi.'});
    }
  };
  return {kind:'postgres',db:proxy('db'),seed:proxy('seed'),cache:()=>current().cache,markDirty:()=>{current().dirty=true;},transaction,middleware,pool};
}
module.exports={createPostgresStorage};
