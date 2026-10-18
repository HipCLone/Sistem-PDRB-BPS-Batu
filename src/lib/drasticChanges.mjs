import { cellValue, displayCell } from './cells.mjs';
import { detectBlocks, mergedValue } from './sheetPresentation.mjs';
import { parsePeriod } from './periods.mjs';

const monthPattern=/\b(januari|jan|februari|feb|maret|mar|april|apr|mei|juni|jun|juli|jul|agustus|agu|ags|september|sept|sep|oktober|okt|november|nov|desember|des)\b/i;
const months={jan:1,feb:2,mar:3,apr:4,mei:5,jun:6,jul:7,agu:8,ags:8,sep:9,okt:10,nov:11,des:12};
const quarterPattern=/(?:triwulan|\btw)\s*[-_.]?\s*(?:IV|III|II|I|[1-4])\b/gi;
const yearPattern=/\b(?:19|20)\d{2}\b/g;
const numeric=value=>typeof value==='number'?value:typeof value==='string'&&/^[+-]?\d+(?:\.\d+)?$/.test(value.trim())?Number(value):null;

function time(text,fallbackYear){
  const p=parsePeriod(text,fallbackYear),month=String(text).match(monthPattern);
  if(!p.year)return null;
  const year=Number(p.year);
  if(p.quarter)return {kind:'quarter',index:year*4+Number(p.quarter)-1,label:`${year} Triwulan ${p.quarter}`};
  if(month){const n=months[month[1].toLowerCase().slice(0,3)];return {kind:'month',index:year*12+n-1,label:`${year} Bulan ${n}`};}
  return {kind:'year',index:year,label:String(year)};
}
function metric(text){
  return String(text).toLowerCase().replace(quarterPattern,' ').replace(yearPattern,' ')
    .replace(/\([^)]*\)/g,part=>monthPattern.test(part)?' ':part)
    .replace(new RegExp(monthPattern.source,'gi'),' ').replace(/\b(tahun|bulan)\b/g,' ')
    .replace(/[^\p{L}\p{N}%]+/gu,' ').trim();
}
function fallbackYear(workbook){
  return parsePeriod(workbook.file?.replaceAll('_',' ')||'').year||parsePeriod(workbook.title).year||workbook.periodYear||null;
}
function columnTime(workbook,sheet,block,i){
  const label=block.schemaLabels[i],year=fallbackYear(workbook),p=time(label,year);
  if(p?.kind==='quarter'||p?.kind==='month')return p;
  const sheetMonth=String(sheet.name).match(monthPattern);
  if(sheetMonth&&(p?.kind==='year'||year))return time(`${p?.label||year} ${sheetMonth[1]}`,year);
  const context=time(`${sheet.name} ${workbook.file?.replaceAll('_',' ')||''}`,year);
  if(context?.kind==='quarter'&&(!p||p.label===String(Math.floor(context.index/4)))&&!/^(no\.?|nomor|kode|tahun|satuan|uraian|keterangan|komoditas)/i.test(label))return context;
  return p;
}
function rowIdentity(sheet,block,rowIndex){
  return block.schemaColumns.flatMap((c,i)=>{
    const label=block.schemaLabels[i];
    if(time(label)||/^(no\.?|nomor|tahun)$/i.test(label))return [];
    const value=mergedValue(sheet,rowIndex,c);
    return typeof cellValue(value)==='string'&&displayCell(value)?[[metric(label),displayCell(value).toLowerCase()]]:[];
  });
}
function candidate(workbook,sheet,block,rowIndex,colIndex){
  const i=block.schemaColumns.indexOf(colIndex);
  let period=columnTime(workbook,sheet,block,i);
  if(!period){
    const years=block.schemaColumns.filter((c,n)=>c!==colIndex&&/^tahun$/i.test(block.schemaLabels[n]));
    if(years.length===1)period=time(displayCell(sheet.rows[rowIndex]?.[years[0]]));
  }
  if(!period)return null;
  return {period,measure:metric(block.schemaLabels[i]),indicator:rowIdentity(sheet,block,rowIndex)};
}

export function assessDrasticChange(workbook,{sheetIndex,rowIndex,colIndex,value},workbooks=[workbook]){
  value=numeric(value);
  if(value===null||!Number.isFinite(value))return null;
  const sheet=workbook.sheets[sheetIndex],block=sheet&&detectBlocks(sheet).find(b=>b.editableRowIndexes.includes(rowIndex)&&b.schemaColumns.includes(colIndex));
  if(!block||numeric(cellValue(sheet.rows[rowIndex]?.[colIndex]))===value)return null;
  const target=candidate(workbook,sheet,block,rowIndex,colIndex);
  if(!target)return null;
  const matches=[];
  const collect=(w,s,b,r,c)=>{
    const item=candidate(w,s,b,r,c);
    if(!item||item.period.kind!==target.period.kind||item.period.index!==target.period.index-1||item.measure!==target.measure)return;
    matches.push({workbookId:w.id,sheetIndex:w.sheets.indexOf(s),rowIndex:r,colIndex:c,period:item.period.label,value:numeric(cellValue(mergedValue(s,r,c)))});
  };
  for(const c of block.schemaColumns)collect(workbook,sheet,block,rowIndex,c);
  if(!matches.length&&block.schemaLabels.some(label=>/^tahun$/i.test(label))){
    for(const r of block.editableRowIndexes){
      if(r!==rowIndex&&JSON.stringify(rowIdentity(sheet,block,r))===JSON.stringify(target.indicator))collect(workbook,sheet,block,r,colIndex);
    }
  }
  if(!matches.length&&target.indicator.length){
    for(const w of workbooks){
      if(w.institution!==workbook.institution)continue;
      for(const s of w.sheets)for(const b of detectBlocks(s)){
        if(w.id===workbook.id&&s===sheet&&b.id===block.id)continue;
        if(metric(b.label)!==metric(block.label))continue;
        for(const r of b.editableRowIndexes){
          if(JSON.stringify(rowIdentity(s,b,r))!==JSON.stringify(target.indicator))continue;
          for(const c of b.schemaColumns)collect(w,s,b,r,c);
        }
      }
    }
  }
  if(matches.length!==1)return null;
  const previous=matches[0];
  if(typeof previous.value!=='number'||!Number.isFinite(previous.value)||previous.value<=0)return null;
  const direction=value>=previous.value*2?'increase':value<=previous.value*0.5?'decrease':null;
  if(!direction)return null;
  return {direction,table:block.label,indicator:target.indicator.map(([,v])=>v).join(' / ')||`Baris ${rowIndex+1}`,
    currentPeriod:target.period.label,currentValue:value,previous,percentage:(value-previous.value)/previous.value*100};
}
