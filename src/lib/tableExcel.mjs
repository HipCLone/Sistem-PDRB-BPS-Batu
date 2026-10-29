import { mergedCells, mergedValue } from './sheetPresentation.mjs';
import { cellValue, displayCell, isUnavailableCell } from './cells.mjs';

export function tableExcelWorkbook(XLSX,sheet,block){
  const merges=mergedCells(sheet);
  const rows=[block.labels,...block.rowIndexes.map(r=>block.columns.map(c=>{
    const cell=mergedValue(sheet,r,c,merges),value=cellValue(cell);
    return isUnavailableCell(cell)?'-':typeof value==='number'&&Number.isFinite(value)?value:displayCell(cell);
  }))];
  const worksheet=XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols']=block.columns.map((_,i)=>({wch:Math.min(80,rows.reduce((width,row)=>Math.max(width,String(row[i]??'').length+2),12))}));
  if(block.columns.length)worksheet['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(0,rows.length-1),c:block.columns.length-1}})};
  const workbook=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook,worksheet,'Data');
  return workbook;
}

export async function downloadTableExcel(sheet,block){
  const XLSX=await import('xlsx');
  const content=XLSX.write(tableExcelWorkbook(XLSX,sheet,block),{type:'array',bookType:'xlsx'});
  const url=URL.createObjectURL(new Blob([content],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  const link=document.createElement('a');link.href=url;link.download=(block.label.replace(/[<>:"/\\|?*\x00-\x1f]/g,' ').trim().slice(0,120)||'tabel')+'.xlsx';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
