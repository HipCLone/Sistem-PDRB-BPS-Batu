const quarters={I:'1',II:'2',III:'3',IV:'4',1:'1',2:'2',3:'3',4:'4'};
export function parsePeriod(text, fallbackYear=null) {
  const value=String(text||'');
  const quarter=quarters[value.match(/(?:triwulan|\btw)\s*[-_.]?\s*(IV|III|II|I|[1-4])\b/i)?.[1]?.toUpperCase()]||null;
  const year=value.match(/\b(?:19|20)\d{2}\b/)?.[0]||(quarter?fallbackYear:null);
  return {year,quarter};
}
export function workbookPeriods(workbook, blocksBySheet=[]) {
  const found=new Map();
  const file=parsePeriod(String(workbook.file).replaceAll('_',' '));
  const add=period=>{if(period.year)found.set(`${period.year}:${period.quarter||''}`,period)};
  add(file);
  for(const [sheetIndex,blocks] of blocksBySheet.entries())for(const block of blocks)for(const label of block.schemaLabels){
    const period=parsePeriod(label,file.year);
    if(period.year&&!period.quarter){
      const month=String(workbook.sheets?.[sheetIndex]?.name||'').trim().toLowerCase();
      if(/^(jan|feb|mar)/.test(month))period.quarter='1';
      else if(/^(apr|mei|jun)/.test(month))period.quarter='2';
      else if(/^(jul|agu|sep)/.test(month))period.quarter='3';
      else if(/^(okt|nov|des)/.test(month))period.quarter='4';
    }
    if(period.quarter||/\b(?:19|20)\d{2}\b/.test(label))add(period);
  }
  return [...found.values()].sort((a,b)=>`${a.year}${a.quarter||0}`.localeCompare(`${b.year}${b.quarter||0}`));
}
export function matchesPeriod(workbook,year='all',quarter='all') {
  if(year==='all'&&quarter==='all')return true;
  return (workbook.periods||[{year:workbook.periodYear,quarter:workbook.periodQuarter}]).some(p=>(year==='all'||p.year===year)&&(quarter==='all'||p.quarter===quarter));
}
export function filterBlockPeriod(block,year='all',quarter='all',fallbackYear=null) {
  if(year==='all'&&quarter==='all')return block;
  const selected=block.columns.map((column,i)=>({column,i,period:parsePeriod(block.labels[i],fallbackYear)})).filter(({period})=>
    (!period.year&&!period.quarter)||((year==='all'||!period.year||year===period.year)&&(quarter==='all'||!period.quarter||quarter===period.quarter)));
  return {...block,columns:selected.map(x=>x.column),labels:selected.map(x=>block.labels[x.i]),headerPaths:selected.map(x=>block.headerPaths[x.i])};
}

export function withNamedColumns(block){
  const selected=block.schemaColumns.map((column,i)=>({column,i,label:block.schemaLabels[i]})).filter(({column,label})=>
    block.columns.includes(column)||(String(label||'').trim()&&!/^(?:keterangan|nilai) sumber \([A-Z]+\)$/i.test(label)));
  return {...block,columns:selected.map(x=>x.column),labels:selected.map(x=>block.schemaLabels[x.i]),headerPaths:selected.map(x=>block.schemaPaths[x.i])};
}
