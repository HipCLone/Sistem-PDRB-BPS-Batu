import {cellValue, hasContent, isNumericCell} from './cells.mjs';
import {detectBlocks} from './sheetPresentation.mjs';
import {parsePeriod} from './periods.mjs';

const months={jan:1,feb:2,mar:3,apr:4,mei:5,jun:6,jul:7,agu:8,ags:8,sep:9,okt:10,nov:11,des:12};
const monthPattern=/\b(januari|jan|februari|feb|maret|mar|april|apr|mei|juni|jun|juli|jul|agustus|agu|ags|september|sept|sep|oktober|okt|november|nov|desember|des)\b/i;
const descriptor=/^(?:no\.?|nomor|kode(?:\s+rekening)?|uraian|keterangan|komoditas|satuan|kategori|nama|jenis|sektor|tahun|periode|triwulan|klasifikasi|wilayah|kabupaten)(?:\s*$|\s*·)/i;
const derived=/(?:\bgrowth\b|\bgrouwth\b|\bfenomena\b)/i;
const annualAuxiliary=/(?:\bpagu\b|\banggaran\b|\bpersentase\b|^%)/i;
const measure=/(?:nilai|realisasi|jumlah|produksi|volume|pendapatan|harga|investasi|proyek|pemakaian|distribusi|berat|kunjungan|pasien|siswa)/i;
const placeholder=/^(?:n\/?a|belum\s+(?:ada|tersedia|diisi)|tidak\s+tersedia|kosong)$/i;

function extractPeriod(text,fallbackYear=null){
  const value=String(text||'').replaceAll('_',' '), parsed=parsePeriod(value,fallbackYear);
  const month=value.match(monthPattern),shortYear=value.match(/\b(?:jan|feb|mar|apr|mei|jun|jul|agu|ags|sep|okt|nov|des)\s*[- /]?\s*(\d{2})\b/i);
  const year=parsed.year||(shortYear?`20${shortYear[1]}`:fallbackYear);
  if(parsed.quarter)return {year:year?String(year):null,quarter:String(parsed.quarter)};
  if(month&&year)return {year:String(year),quarter:String(Math.ceil(months[month[1].slice(0,3).toLowerCase()]/3))};
  return {year:year?String(year):null,quarter:null};
}

function cellAvailability(sheet){
  const cache=new Map(),active=new Set();
  const colIndex=letters=>[...letters.toUpperCase()].reduce((n,ch)=>n*26+ch.charCodeAt(0)-64,0)-1;
  const get=(r,c)=>{
    const key=`${r}:${c}`;
    if(cache.has(key))return cache.get(key);
    if(active.has(key)||active.size>=100)return null;
    const cell=sheet.rows[r]?.[c];
    if(!hasContent(cell))return false;
    if(cell?.t!=='formula')return true;
    const formula=String(cell.v||'');
    if(/[!\[\]]/.test(formula))return null;
    active.add(key);
    const references=[...formula.matchAll(/(?<![A-Za-z0-9_])\$?([A-Za-z]{1,3})\$?([1-9]\d*)(?::\$?([A-Za-z]{1,3})\$?([1-9]\d*))?(?![A-Za-z0-9_(])/g)];
    let result=true;
    for(const [,firstCol,firstRow,lastCol,lastRow] of references){
      const startCol=colIndex(firstCol),startRow=Number(firstRow)-1;
      if(!lastCol){const value=get(startRow,startCol);if(value===false){result=false;break;}if(value===null)result=null;continue;}
      const endCol=colIndex(lastCol),endRow=Number(lastRow)-1;
      if(endCol<startCol||endRow<startRow||(endCol-startCol+1)*(endRow-startRow+1)>100000){result=null;continue;}
      let any=false,uncertain=false;
      for(let row=startRow;row<=Math.min(endRow,sheet.rows.length-1);row++)for(let col=startCol;col<=Math.min(endCol,(sheet.maxCol||0)-1);col++){
        const value=get(row,col);if(value===true)any=true;else if(value===null)uncertain=true;
      }
      if(!any&&!uncertain){result=false;break;}
      if(!any&&uncertain)result=null;
    }
    active.delete(key);cache.set(key,result);return result;
  };
  return get;
}

export function quarterStatus(workbook,year){
  year=String(year);
  const found=new Set(),uncertain=new Set();let hasQuarterContext=false,unresolved=false;
  const file=extractPeriod(workbook.file),explicit=workbook.reportingYear&&workbook.reportingQuarter?{year:String(workbook.reportingYear),quarter:String(workbook.reportingQuarter)}:null;
  if((explicit&&explicit.year===year)||(file.quarter&&file.year===year))hasQuarterContext=true;
  for(const sheet of workbook.sheets||[]){
    const available=cellAvailability(sheet);
    const sheetPeriod=extractPeriod(sheet.name,explicit?.year||file.year);
    const context=(sheetPeriod.quarter&&sheetPeriod.year?sheetPeriod:null)||explicit||(file.quarter&&file.year?file:null);
    if(sheetPeriod.quarter&&sheetPeriod.year===year)hasQuarterContext=true;
    for(const block of detectBlocks(sheet)){
      const yearCol=block.schemaColumns.find((c,i)=>/^tahun$/i.test(block.schemaLabels[i]||''));
      const quarterCol=block.schemaColumns.find((c,i)=>/^(?:triwulan|periode)$/i.test(block.schemaLabels[i]||''));
      for(let i=0;i<block.schemaColumns.length;i++){
        const column=block.schemaColumns[i],label=block.schemaLabels[i]||'';
        if(descriptor.test(label)||derived.test(label))continue;
        const period=extractPeriod(label,sheetPeriod.year||explicit?.year||file.year);
        if(period.quarter&&period.year===year)hasQuarterContext=true;
        if(!period.quarter&&annualAuxiliary.test(label))continue;
        for(const r of block.editableRowIndexes){
          if(block.sectionRows.includes(r))continue;
          const value=sheet.rows[r]?.[column];
          if(!hasContent(value)||placeholder.test(String(cellValue(value)).trim())||!(isNumericCell(value)||((period.quarter||measure.test(label))&&typeof cellValue(value)==='string')))continue;
          const rowYear=yearCol===undefined?null:String(cellValue(sheet.rows[r]?.[yearCol])||'').trim();
          const rawQuarter=quarterCol===undefined?'':String(cellValue(sheet.rows[r]?.[quarterCol])||'').trim();
          const rowQuarter=/^[1-4]$/.test(rawQuarter)?rawQuarter:parsePeriod(rawQuarter).quarter;
          const rowPeriod=/^20\d{2}$/.test(rowYear)&&rowQuarter?{year:rowYear,quarter:rowQuarter}:null;
          const effective=period.quarter&&period.year?period:period.quarter&&/^20\d{2}$/.test(rowYear)?{year:rowYear,quarter:period.quarter}:rowPeriod||(context&&(!period.year||period.year===context.year)?context:null);
          const valid=available(r,column);
          if(effective){if(effective.year===year){hasQuarterContext=true;if(valid===true)found.add(effective.quarter);else if(valid===null)uncertain.add(effective.quarter);}}
          else if(valid!==false&&(!period.year||period.year===year))unresolved=true;
        }
      }
    }
  }
  return [1,2,3,4].map(quarter=>({quarter,submitted:found.has(String(quarter)),
    status:found.has(String(quarter))?'filled':uncertain.has(String(quarter))||!hasQuarterContext&&unresolved?'unknown':'empty'}));
}
