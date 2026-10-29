import {mergedCells, mergedValue} from './sheetPresentation.mjs';
import {displayCell} from './cells.mjs';

export function tableCsv(sheet,block){
  const merges=mergedCells(sheet);
  const field=value=>{
    let text=String(value??'');
    if(/^[\s]*[=+@-]/.test(text)&&!/^\s*-?\d+(?:[.,]\d+)?\s*$/.test(text))text="'"+text;
    return '"'+text.replaceAll('"','""')+'"';
  };
  const rows=[block.labels,...block.rowIndexes.map(r=>block.columns.map(c=>displayCell(mergedValue(sheet,r,c,merges))))];
  return '\uFEFF'+rows.map(row=>row.map(field).join(',')).join('\r\n');
}
export function downloadTableCsv(sheet,block){
  const url=URL.createObjectURL(new Blob([tableCsv(sheet,block)],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=(block.label.replace(/[<>:"/\\|?*\x00-\x1f]/g,' ').trim().slice(0,120)||'tabel')+'.csv';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
