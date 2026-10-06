const XLSX=require('xlsx');
const {normalizeSheet}=require('./clean.js');

function readSheets(filename,id){
  const workbook=XLSX.readFile(filename,{cellFormula:true,cellNF:true,cellDates:false});
  let total=0;
  return workbook.SheetNames.map((name,i)=>{
    const ws=workbook.Sheets[name];
    const cells=Object.entries(ws).filter(([address,cell])=>/^[A-Z]+\d+$/.test(address)&&(cell.v!=null||cell.f));
    let height=0,width=0;
    for(const [address] of cells){const {r,c}=XLSX.utils.decode_cell(address);height=Math.max(height,r+1);width=Math.max(width,c+1);}
    total+=height*width;
    if(total>1000000)throw new Error('File melebihi batas satu juta sel. Pisahkan data menjadi beberapa file.');
    const rows=Array.from({length:height},()=>Array(width).fill(null));
    for(const [address,cell] of cells){
      const {r,c}=XLSX.utils.decode_cell(address);
      const isDate=!cell.f&&cell.t==='n'&&XLSX.SSF.is_date(cell.z||'General');
      rows[r][c]={v:cell.f?`=${cell.f}`:cell.t==='e'?(cell.w||'#VALUE!'):isDate?XLSX.SSF.format('yyyy-mm-dd',cell.v):cell.v,
        t:cell.t==='e'?'error':cell.f?'formula':isDate?'date':cell.t==='n'?'number':cell.t==='b'?'boolean':'string',
        calc:cell.f&&cell.t!=='e'?cell.v??null:null,fmt:cell.z||'General'};
    }
    return normalizeSheet({id:`${id}-${i}`,name,rows,maxCol:width,mergedRanges:(ws['!merges']||[]).map(m=>XLSX.utils.encode_range(m))});
  });
}
module.exports={readSheets};
