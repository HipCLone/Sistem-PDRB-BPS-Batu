import { displayCell, hasContent, isNumericCell, isUnavailableCell } from './cells.mjs';
import { sheetProfile } from './sheetProfiles.mjs';

export function columnLetter(index) {
  let text = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) text = String.fromCharCode(65 + (n - 1) % 26) + text;
  return text;
}
const colIndex = letters => [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
export function mergedCells(sheet) {
  return (sheet.mergedRanges || []).flatMap(range => {
    const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range);
    return m ? [{r: +m[2]-1, c: colIndex(m[1]), endRow: +m[4]-1, endCol: colIndex(m[3])}] : [];
  });
}
export function mergedValue(sheet, row, column, merges = mergedCells(sheet)) {
  const own = sheet.rows[row]?.[column];
  if (hasContent(own) || isUnavailableCell(own)) return own;
  const merge = merges.find(m => row >= m.r && row <= m.endRow && column >= m.c && column <= m.endCol);
  return merge ? sheet.rows[merge.r]?.[merge.c] : own;
}
const cellsAt = (sheet, row, from, to) => (sheet.rows[row] || []).flatMap((cell, c) => c >= from && c <= to && hasContent(cell) ? [{cell,c,text:displayCell(cell)}] : []);
const line = cells => [...new Set(cells.map(x => x.text))].join(' · ');
const HEADER = /^(no\.?|nomor|uraian|keterangan|komoditas|sektor|kode rekening|kode|nama|jenis|klasifikasi|kabupaten|tahun|periode|indikator|satuan|anggaran|realisasi|produksi|produk|volume|jumlah)/i;
const PERIOD = /^(?:19|20)\d{2}$|^(?:20\d{2}\s*)?(?:TW|triwulan)\s*[IV1-4]+/i;
const METADATA = /^(?:kabupaten\s*\/\s*kota\s*:|nama perusahaan\s*:|wilayah tujuan\s*:|sumber\s*:|nip\b|mengetahui\b|kepala\b|hormat\b|catatan\s*:|keterangan\s*:|batu\s*,)/i;
function looksHeader(cells) {
  if (cells.length < 2 || cells.some(x => x.cell?.t === 'formula' || isUnavailableCell(x.cell))) return false;
  return cells.some(x => HEADER.test(x.text)) && cells.every(x => !isNumericCell(x.cell) || PERIOD.test(x.text));
}
// Uploaded files use conservative detection; never discard a first data row
// without a recognizable header or interpret unresolved formulas as headings.
function genericHeaders(sheet) {
  const headers = [];
  let lastData = -1;
  for (let r = 0; r < sheet.rows.length; r++) {
    const cells = cellsAt(sheet, r, 0, Infinity);
    if (!cells.length) continue;
    if (looksHeader(cells)) {
      if (headers.length && headers.at(-1).at(-1) === r - 1 && lastData < headers.at(-1)[0]) headers.at(-1).push(r);
      else if (!headers.length || r > lastData + 1 || line(cells)===line(cellsAt(sheet,headers.at(-1)[0],0,Infinity))) headers.push([r]);
      else lastData = r;
    } else if (headers.length) {
      const group = headers.at(-1);
      const periodOnly = cells.length >= 2 && cells.every(x => PERIOD.test(x.text) || /^(I|II|III|IV|proyek|investasi|fisik|keuangan)$/i.test(x.text));
      if (group.at(-1) === r - 1 && lastData < group[0] && periodOnly) group.push(r);
      else lastData = r;
    }
  }
  return headers;
}
function guideRow(cells) {
  return cells.length >= 3 && cells.some(x=>/^\d+\s*=/.test(x.text)) && cells.every((x, i) => x.text === String(i + 1) || (i >= 3 && /^\d+\s*=/.test(x.text)));
}
function headerParts(sheet, headers, c, merges, overrides) {
  if (overrides?.[c]) return [overrides[c]];
  const parts = [];
  for (const r of headers) {
    const value = mergedValue(sheet, r, c, merges);
    if (!hasContent(value) || value?.t === 'formula') continue;
    let text = displayCell(value);
    // Growth / phenomenon columns follow a specific period in these sheets.
    // Use that explicit adjacent period, not an arbitrary forward-fill.
    if (/^(growth|grouwth|fenomena)$/i.test(text)) {
      for (let left=c-1;left>=0;left--) {
        const adjacent=displayCell(sheet.rows[r]?.[left]);
        if (/(?:TW|triwulan)\s*[IV1-4]+/i.test(adjacent)) {text=`${adjacent} · ${text}`;break;}
        if (adjacent&&!/^(growth|grouwth|fenomena)$/i.test(adjacent)) break;
      }
    }
    if (/^[1-4]$/.test(text) && headers.length > 1) text = `Triwulan ${text}`;
    else if (/^(I|II|III|IV)$/.test(text)) text = `Triwulan ${text}`;
    if (parts.at(-1) !== text) parts.push(text);
  }
  return parts;
}
export function dataColumns(sheet, rowIndexes) {
  const width = Math.max(sheet.maxCol || 0, ...sheet.rows.map(row => row?.length || 0));
  return Array.from({length:width}, (_,c)=>c).filter(c => rowIndexes.some(r => hasContent(sheet.rows[r]?.[c])));
}

function detectSourceBlocks(sheet) {
  if (!sheet?.rows?.length) return [];
  const rows = sheet.rows;
  const profile = sheetProfile(sheet);
  const groups = (profile?.headers ?? genericHeaders(sheet)).filter(h => h[0] < rows.length);
  const merges = mergedCells(sheet);
  const width = Math.max(sheet.maxCol || 0, ...rows.map(row=>row?.length || 0));
  if (!width) return [];
  const blocks = [];
  const definitions = groups.length ? groups : [[]];
  definitions.forEach((mainHeaders, groupIndex) => {
    const start = mainHeaders.length ? mainHeaders[0] : profile?.dataStart || 0;
    const end = definitions[groupIndex+1]?.[0] ?? rows.length;
    const ranges = profile?.splitColumns || [[0, width-1]];
    ranges.forEach(([from, rangeEnd], rangeIndex) => {
      const to = Math.min(rangeEnd, width-1);
      if (from > to) return;
      const headers = rangeIndex ? [] : mainHeaders;
      const bodyStart = rangeIndex ? start : mainHeaders.length ? Math.max(...mainHeaders)+1 : start;
      const rowIndexes = [], noteRows = [], placeholderRows = [], unavailableRows = [], sectionRows = [], guideRows = [], notes = [];
      const addNote = (r, cells) => { noteRows.push(r); if (cells.length) notes.push(line(cells)); };
      const previousEnd = groupIndex ? Math.max(...definitions[groupIndex-1])+1 : 0;
      if (!groupIndex) for (let r = 0; r < bodyStart; r++) if (!headers.includes(r)) addNote(r, cellsAt(sheet,r,from,to));
      if (groupIndex) for (let r=Math.max(previousEnd,start-3);r<start;r++) {
        const cells=cellsAt(sheet,r,from,to);
        if (cells.length && blocks.some(b=>b.noteRows.includes(r))) notes.push(line(cells));
      }
      const leadingNotes=[...notes];
      const schemaColumns = Array.from({length:to-from+1}, (_,i)=>from+i).filter(c => headers.some(r => hasContent(mergedValue(sheet,r,c,merges))) || profile?.labels?.[c]);
      const numberCols = schemaColumns.filter(c => /^(no\.?|nomor)$/i.test(headerParts(sheet,headers,c,merges,profile?.labels).join(' ')));
      for (let r = bodyStart; r < end; r++) {
        const cells = cellsAt(sheet,r,from,to);
        const raw = (rows[r] || []).slice(from,to+1);
        if (!cells.length) {
          if (raw.some(isUnavailableCell)) unavailableRows.push(r);
          else if (raw.some(c=>c != null && (typeof c==='object'?c.v != null:c!==''))) placeholderRows.push(r);
          continue;
        }
        if (r === bodyStart && guideRow(cells)) { guideRows.push(r); continue; }
        const nearNextHeader = groupIndex < definitions.length-1 && r >= end-3 && cells.length===1 && !isNumericCell(cells[0].cell)
          && (cellsAt(sheet,r-1,from,to).length===0 || /^growth$/i.test(cells[0].text));
        if (METADATA.test(cells[0].text) || nearNextHeader) { addNote(r,cells); continue; }
        if (cells.every(x => numberCols.includes(x.c))) { placeholderRows.push(r); continue; }
        const horizontalSection = cells.length === 1 && !isNumericCell(cells[0].cell) && (cells[0].c===profile?.sectionColumn || merges.some(m => m.r===r && m.c===cells[0].c && m.endCol>m.c && m.endRow===r));
        if (horizontalSection) sectionRows.push(r);
        rowIndexes.push(r);
      }
      const dataRows = rowIndexes.filter(r=>!sectionRows.includes(r));
      if (!dataRows.length && sectionRows.length) {
        for (const r of sectionRows) addNote(r,cellsAt(sheet,r,from,to));
        rowIndexes.length=0; sectionRows.length=0;
      }
      const columns = Array.from({length:to-from+1},(_,i)=>from+i).filter(c=>dataRows.some(r=>hasContent(mergedValue(sheet,r,c,merges))));
      const unlabelledColumns = [];
      const partsFor = c => {
        const parts = headerParts(sheet,headers,c,merges,profile?.labels);
        if (!parts.length) {
          unlabelledColumns.push(c);
          const numeric = dataRows.some(r=>isNumericCell(rows[r]?.[c]));
          parts.push(`${numeric?'Nilai sumber':'Keterangan sumber'} (${columnLetter(c)})`);
        }
        return parts;
      };
      const headerPaths = columns.map(partsFor);
      const labels = headerPaths.map(parts=>parts.join(' · '));
      const counts = new Map();
      labels.forEach(label=>counts.set(label,(counts.get(label)||0)+1));
      labels.forEach((label,i)=>{if(counts.get(label)>1){labels[i]=`${label} (${columnLetter(columns[i])})`;headerPaths[i]=[...headerPaths[i],`Sumber ${columnLetter(columns[i])}`];}});
      for (const c of columns) if (!schemaColumns.includes(c)) schemaColumns.push(c);
      schemaColumns.sort((a,b)=>a-b);
      const schemaPaths = schemaColumns.map(c => headerParts(sheet,headers,c,merges,profile?.labels));
      schemaPaths.forEach((parts,i)=>{if(!parts.length)parts.push(labels[columns.indexOf(schemaColumns[i])]||`Keterangan sumber (${columnLetter(schemaColumns[i])})`);});
      const schemaLabels = schemaPaths.map(parts=>parts.join(' · '));
      const unavailableCount = rows.slice(bodyStart,end).reduce((sum,row)=>sum+row.slice(from,to+1).filter(isUnavailableCell).length,0);
      const measurementColumns=schemaColumns.filter(c=>headerParts(sheet,headers,c,merges,profile?.labels).some(part=>/(?:triwulan|\btw\b|anggaran|realisasi|investasi|pendapatan|harga|volume|penjualan|nilai)/i.test(part)));
      const reportedCount=dataRows.reduce((sum,r)=>sum+cellsAt(sheet,r,from,to).filter(x=>!numberCols.includes(x.c)&&(isNumericCell(x.cell)||measurementColumns.includes(x.c))).length,0);
      const sourceTitle = leadingNotes.findLast(note=>note.length>3&&!METADATA.test(note)&&!/^\*|^(?:triwulan|tahun anggaran)|^\d{2}\s/i.test(note));
      const metric = headers.length ? cellsAt(sheet,headers[0],from,to).find(x=>x.c>from&&!isNumericCell(x.cell)&&!PERIOD.test(x.text)&&! /^(satuan|anggaran|uraian|kode|sektor)$/i.test(x.text))?.text : null;
      const title = sourceTitle || metric || `${sheet.name} · Tabel ${groupIndex+1}`;
      blocks.push({
        id:`blok-${blocks.length+1}`, label: rangeIndex ? `Perhitungan pendukung ${rangeIndex}` : `${title}${metric&&metric!==title?' · '+metric:''}`,
        headerRows:headers, rowIndexes, columns, labels, headerPaths, notes:[...new Set(notes)], schemaColumns, schemaLabels, schemaPaths,
        sectionRows, noteRows, placeholderRows, unavailableRows, guideRows, unlabelledColumns:[...new Set(unlabelledColumns)],
        unavailableCount, isTemplate:!rowIndexes.length||(measurementColumns.length>0&&reportedCount===0), sourceRange:{from,to,start:bodyStart,end}, reviewed:!!profile,
      });
    });
  });
  return blocks;
}

function detectUnfilteredBlocks(sheet) {
  const addedRows=sheet?.tableRows||[],addedColumns=sheet?.tableColumns||[];
  if(!addedRows.length&&!addedColumns.length)return detectSourceBlocks(sheet);
  const rowSet=new Set(addedRows.map(x=>x.rowIndex)),columnSet=new Set(addedColumns.map(x=>x.colIndex));
  // Added data keeps physical coordinates while belonging to one source table.
  const source={...sheet,rows:sheet.rows.map((row,r)=>rowSet.has(r)?[]:row.map((cell,c)=>columnSet.has(c)?null:cell))};
  return detectSourceBlocks(source).map(block=>{
    const ownColumns=addedColumns.filter(x=>x.tableId===block.id);
    const rowIndexes=[...block.rowIndexes,...addedRows.filter(x=>x.tableId===block.id&&sheet.rows[x.rowIndex]?.some(hasContent)).map(x=>x.rowIndex)];
    const schemaColumns=[...block.schemaColumns,...ownColumns.map(x=>x.colIndex)];
    const schemaPaths=[...block.schemaPaths,...ownColumns.map(x=>[x.label])];
    const columns=schemaColumns.filter(c=>rowIndexes.some(r=>!block.sectionRows.includes(r)&&hasContent(mergedValue(sheet,r,c))));
    const paths=new Map(schemaColumns.map((c,i)=>[c,schemaPaths[i]]));
    return {...block,rowIndexes,columns,labels:columns.map(c=>paths.get(c).join(' · ')),headerPaths:columns.map(c=>paths.get(c)),
      schemaColumns,schemaPaths,schemaLabels:schemaPaths.map(p=>p.join(' · ')),isTemplate:rowIndexes.length===0};
  });
}

export function detectBlocks(sheet){
  return detectUnfilteredBlocks(sheet).flatMap(block=>{
    const state=sheet?.tableState?.[block.id]||{};
    if(state.deleted)return [];
    const trackedRows=(sheet.editedRows||[]).filter(r=>r.tableId===block.id).map(r=>r.rowIndex);
    const additions=(sheet.tableRows||[]).filter(r=>r.tableId===block.id);
    const orderRows=rows=>{const set=new Set(rows),added=new Set(additions.map(r=>r.rowIndex));const ordered=[...new Set([...rows,...block.rowIndexes,...block.placeholderRows,...trackedRows])].filter(r=>!added.has(r)).sort((a,b)=>a-b);for(const item of additions){const target=ordered.indexOf(item.beforeRowIndex);if(target<0)ordered.push(item.rowIndex);else ordered.splice(target,0,item.rowIndex);}return ordered.filter(r=>set.has(r));};
    const allRows=[...block.rowIndexes,...trackedRows.filter(r=>sheet.rows[r]?.some(hasContent))];
    const rowIndexes=orderRows(allRows).filter(r=>!state.deletedRows?.includes(r));
    const displayEditRowIndexes=orderRows([...allRows,...block.placeholderRows,...trackedRows,...additions.map(r=>r.rowIndex)]).filter(r=>!state.deletedRows?.includes(r));
    const editableRowIndexes=displayEditRowIndexes.filter(r=>!block.sectionRows.includes(r));
    const schemaColumns=block.schemaColumns.filter(c=>!state.deletedColumns?.includes(c));
    const columns=block.columns.filter(c=>schemaColumns.includes(c));
    const paths=new Map(block.schemaColumns.map((c,i)=>[c,state.columnLabels?.[c]?[state.columnLabels[c]]:(block.headerPaths[block.columns.indexOf(c)]||block.schemaPaths[i])]));
    return [{...block,label:state.label||(sheet.manualHeaders?sheet.name:block.label),rowIndexes,editableRowIndexes,displayEditRowIndexes,columns,schemaColumns,
      labels:columns.map(c=>paths.get(c).join(' · ')),headerPaths:columns.map(c=>paths.get(c)),
      schemaLabels:schemaColumns.map(c=>paths.get(c).join(' · ')),schemaPaths:schemaColumns.map(c=>paths.get(c)),
      sectionRows:block.sectionRows.filter(r=>rowIndexes.includes(r)),placeholderRows:block.placeholderRows.filter(r=>!state.deletedRows?.includes(r)),isTemplate:!rowIndexes.length||block.isTemplate}];
  });
}
