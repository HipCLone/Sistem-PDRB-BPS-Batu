const {createHash}=require('crypto');

const definitions={
  institutions:{columns:['name'],key:['name']},
  users:{columns:['id','username','role','institution'],key:['id']},
  datasets:{columns:['id','origin','source_order','institution','title','filename'],key:['id']},
  sheets:{columns:['dataset_id','kind','sheet_index','sheet_id','name'],key:['dataset_id','kind','sheet_index']},
  cell_overrides:{columns:['dataset_id','sheet_index','row_index','col_index'],key:['dataset_id','sheet_index','row_index','col_index']},
  added_rows:{columns:['dataset_id','sheet_index','position'],key:['dataset_id','sheet_index','position']},
  added_columns:{columns:['dataset_id','sheet_index','position'],key:['dataset_id','sheet_index','position']},
  edited_rows:{columns:['dataset_id','sheet_index','position'],key:['dataset_id','sheet_index','position']},
  table_states:{columns:['dataset_id','sheet_index','table_id'],key:['dataset_id','sheet_index','table_id']},
  dataset_details:{columns:['dataset_id','institution'],key:['dataset_id']},
  deleted_datasets:{columns:['dataset_id'],key:['dataset_id']},
  audit_events:{columns:['id','position','action','actor','dataset_id','institution'],key:['id']},
  notifications:{columns:['id','position','recipient_id','event_id','dataset_id','read_at'],key:['id']},
  app_metadata:{columns:['key'],key:['key']}
};
const clone=value=>JSON.parse(JSON.stringify(value));
const index=value=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<0||String(n)!==String(value))throw new Error('Koordinat JSON tidak valid: '+value);return n;};
function flatten(seed,db){
  if(!Array.isArray(seed.workbooks)||!Array.isArray(db.users)||!Array.isArray(db.uploadedWorkbooks)||!Array.isArray(db.audit))throw new Error('Struktur sumber JSON tidak lengkap. Migrasi dibatalkan.');
  const rows=Object.fromEntries(Object.keys(definitions).map(name=>[name,[]]));
  const layout={seed:{...clone(seed),workbooks:[]},db:clone(db)},institutions=new Set();
  const add=(table,fields,path,data)=>rows[table].push({...fields,path,data:clone(data)});
  const institution=name=>{if(name)institutions.add(name);return name||null;};
  const workbooks=(items,origin,root)=>{
    const target=root==='seed'?layout.seed.workbooks:layout.db.uploadedWorkbooks;target.length=0;
    items.forEach((w,i)=>{
      if(typeof w.id!=='string'||!Array.isArray(w.sheets))throw new Error('Dataset JSON tidak valid.');
      const path=[root,root==='seed'?'workbooks':'uploadedWorkbooks',i];target.push(null);
      add('datasets',{id:w.id,origin,source_order:i,institution:institution(w.institution),title:w.title||null,filename:w.file||null},path,{...w,sheets:Array(w.sheets.length).fill(null)});
      w.sheets.forEach((sheet,si)=>add('sheets',{dataset_id:w.id,kind:'base',sheet_index:si,sheet_id:sheet.id||null,name:sheet.name||null},[...path,'sheets',si],sheet));
    });
  };
  workbooks(seed.workbooks,'seed','seed');workbooks(db.uploadedWorkbooks,'upload','db');
  layout.db.users=db.users.map(()=>null);
  db.users.forEach((u,i)=>add('users',{id:u.id,username:u.username,role:u.role,institution:institution(u.institution)},['db','users',i],u));
  const nestedArrays={addedRows:'added_rows',addedColumns:'added_columns',editedRows:'edited_rows',extraSheets:'sheets'};
  for(const [property,table]of Object.entries(nestedArrays)){
    if(db[property]===undefined)continue;
    layout.db[property]={};
    for(const [datasetId,groups]of Object.entries(db[property])){
      if(property==='extraSheets'){
        layout.db[property][datasetId]=groups.map(()=>null);
        groups.forEach((sheet,i)=>add(table,{dataset_id:datasetId,kind:'extra',sheet_index:i,sheet_id:sheet.id||null,name:sheet.name||null},['db',property,datasetId,i],sheet));
      }else{
        layout.db[property][datasetId]={};
        for(const [si,values]of Object.entries(groups)){
          layout.db[property][datasetId][si]=values.map(()=>null);
          values.forEach((value,i)=>add(table,{dataset_id:datasetId,sheet_index:index(si),position:i},['db',property,datasetId,si,i],value));
        }
      }
    }
  }
  if(db.overrides!==undefined){
    layout.db.overrides={};
    for(const [datasetId,values]of Object.entries(db.overrides)){
      layout.db.overrides[datasetId]={};
      for(const [coordinate,value]of Object.entries(values)){
        const parts=coordinate.split(':');if(parts.length!==3)throw new Error('Koordinat override tidak valid.');
        const [si,r,c]=parts.map(index);layout.db.overrides[datasetId][coordinate]=null;
        add('cell_overrides',{dataset_id:datasetId,sheet_index:si,row_index:r,col_index:c},['db','overrides',datasetId,coordinate],value);
      }
    }
  }
  if(db.tableState!==undefined){
    layout.db.tableState={};
    for(const [datasetId,sheets]of Object.entries(db.tableState)){
      layout.db.tableState[datasetId]={};
      for(const [si,states]of Object.entries(sheets)){
        layout.db.tableState[datasetId][si]={};
        for(const [tableId,value]of Object.entries(states)){
          layout.db.tableState[datasetId][si][tableId]=null;
          add('table_states',{dataset_id:datasetId,sheet_index:index(si),table_id:tableId},['db','tableState',datasetId,si,tableId],value);
        }
      }
    }
  }
  for(const [property,table]of [['workbookDetails','dataset_details'],['deletedWorkbooks','deleted_datasets']]){
    if(db[property]===undefined)continue;layout.db[property]={};
    for(const [datasetId,value]of Object.entries(db[property])){
      layout.db[property][datasetId]=null;
      add(table,{dataset_id:datasetId,...(property==='workbookDetails'?{institution:institution(value.institution)}:{})},['db',property,datasetId],value);
    }
  }
  layout.db.audit=db.audit.map(()=>null);
  db.audit.forEach((event,i)=>add('audit_events',{id:event.id||'legacy-'+createHash('sha256').update(JSON.stringify([i,event])).digest('hex'),position:i,action:event.action,actor:event.user||null,dataset_id:event.details?.workbookId||null,institution:event.details?.institution||null},['db','audit',i],event));
  if(db.notifications!==undefined){
    layout.db.notifications=db.notifications.map(()=>null);
    db.notifications.forEach((event,i)=>add('notifications',{id:event.id,position:i,recipient_id:event.recipientId,event_id:event.eventId||null,dataset_id:event.workbookId||null,read_at:event.readAt||null},['db','notifications',i],event));
  }
  for(const name of institutions)add('institutions',{name},null,{name});
  add('app_metadata',{key:'layout'},null,layout);
  for(const [table,values]of Object.entries(rows)){
    const seen=new Set();
    for(const value of values){const key=rowKey(table,value);if(seen.has(key))throw new Error('Identitas duplikat pada '+table+'. Migrasi dibatalkan.');seen.add(key);}
  }
  return rows;
}
function rowKey(table,row){return JSON.stringify(definitions[table].key.map(key=>row[key]));}
function restore(rows){
  const layout=rows.app_metadata.find(row=>row.key==='layout')?.data;
  if(!layout)throw new Error('Data PDRB belum diimpor. Jalankan npm run db:import.');
  const state=clone(layout);
  for(const [table,records]of Object.entries(rows)){
    if(table==='app_metadata'||table==='institutions')continue;
    for(const {path,data}of records){
      if(!Array.isArray(path)||path.length<2)throw new Error('Path data PostgreSQL tidak valid.');
      let parent=state;
      for(const part of path.slice(0,-1)){
        if(!Object.hasOwn(parent,part)||parent[part]===null)throw new Error('Relasi/path data PostgreSQL tidak lengkap.');
        parent=parent[part];
      }
      Object.defineProperty(parent,path.at(-1),{value:clone(data),enumerable:true,configurable:true,writable:true});
    }
  }
  return state;
}
module.exports={definitions,flatten,restore,rowKey};
