import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {detectBlocks,mergedValue} from '../src/lib/sheetPresentation.mjs';
import {displayCell,formatCell,hasContent} from '../src/lib/cells.mjs';
import {auditSheet} from './audit-excel.mjs';
const require=createRequire(import.meta.url);
const {normalizeSheet}=require('../backend/clean.js');
const value=v=>({v,t:typeof v==='number'?'number':'string',calc:null});
const sheet=(rows,extra={})=>({name:'Pengujian',rows:rows.map(row=>row.map(v=>v==null?null:typeof v==='object'?v:value(v))),mergedRanges:[],...extra});
const seed=JSON.parse(fs.readFileSync(new URL('../backend/data/workbooks.json',import.meta.url),'utf8'));
const get=id=>seed.workbooks.flatMap(w=>w.sheets).find(s=>s.id===id);

test('merged year and quarter headers remain contextual after normalization',()=>{
  const input=sheet([['Keterangan',2025,null,2026,null],[null,'I','II','I','II'],['Stok',null,null,42,null]],{mergedRanges:['A1:A2','B1:C1','D1:E1']});
  const normalized=normalizeSheet(input), block=detectBlocks(normalized)[0];
  assert.deepEqual(block.headerRows,[0,1]);
  assert.deepEqual(block.labels,['Keterangan','2026 · Triwulan I']);
  assert(normalized.mergedRanges.includes('D1:E1'));
});
test('sparse values and zero remain visible, all-empty axes disappear',()=>{
  const rows=[['Keterangan','Nilai','Tambahan','Kosong'],...Array.from({length:25},(_,i)=>[`Item ${i}`,i===0?0:i,i===24?99:null,null]),[null,null,null,null]];
  const input=sheet(rows), block=detectBlocks(input)[0];
  assert.deepEqual(block.columns,[0,1,2]);
  assert.equal(block.rowIndexes.length,25);
  assert.equal(formatCell(input.rows[1][1]),'0');
  assert.equal(formatCell(null),'-');
  assert.deepEqual(auditSheet(input).problems,[]);
});
test('no inferred header must not drop a first data row',()=>{
  const block=detectBlocks(sheet([[15,16],[25,26]]))[0];
  assert.deepEqual(block.headerRows,[]);
  assert.deepEqual(block.rowIndexes,[0,1]);
  assert(block.labels.every(Boolean));
});
test('real sequential numeric data is not an Excel column-number guide',()=>{
  const block=detectBlocks(sheet([['No','Nilai A','Nilai B'],[1,2,3],[2,4,5]]))[0];
  assert.deepEqual(block.rowIndexes,[1,2]);
});
test('formula errors never become headings or fake zeros',()=>{
  const unresolved={v:'=G2',t:'formula',calc:null},cached={v:'=G2+1',t:'formula',calc:12},error={v:'#DIV/0!',t:'error'};
  const input=sheet([['Uraian','Nilai'],['A',unresolved],['B',cached],['C',error],[null,unresolved]]);
  const block=detectBlocks(input)[0];
  assert.deepEqual(block.headerRows,[0]);
  assert.deepEqual(block.rowIndexes,[1,2,3]);
  assert.equal(block.unavailableCount,3);
  assert.equal(displayCell(unresolved),'-');
  assert.equal(formatCell(cached),'12');
  assert(!hasContent(error));
});
test('repeated templates are separate and empty fields stay available for admin',()=>{
  const blocks=detectBlocks(get('h-pt-pos-0'));
  assert.equal(blocks.length,4);
  for(const block of blocks){assert.equal(block.rowIndexes.length,0);assert(block.schemaColumns.length>2);}
});
test('BULOG groups are sections, not empty commodity cells',()=>{
  const block=detectBlocks(get('1-pi-bulog-0'))[0];
  assert.deepEqual(block.columns,[2,7,8]);
  assert(block.sectionRows.length>0);
  assert(block.labels.includes('2026 · Triwulan II'));
});
test('school definitions are not swallowed into headers or metadata',()=>{
  const input=get('p-dinas-pendidikan-0'),blocks=detectBlocks(input);
  assert.deepEqual(blocks.map(b=>b.rowIndexes.length),[4,4,4]);
  assert.equal(displayCell(input.rows[blocks[2].rowIndexes[0]][0]),'PAUD');
});
test('investment groups use true merged source labels without mutating source',()=>{
  const input=get('3a-realisasi-pma-dan-pmdn-menurut-sektor-triwulan-i-2026-0');
  const before=JSON.stringify(input);
  assert(hasContent(mergedValue(input,7,0)));
  detectBlocks(input);
  assert.equal(JSON.stringify(input),before);
});
test('reported currency/volume strings and text-only datasets are not called empty templates',()=>{
  assert.equal(detectBlocks(get('atv-0'))[1].isTemplate,false);
  assert.equal(detectBlocks(sheet([['Nama','Jenis'],['Batu TV','Televisi']]))[0].isTemplate,false);
});
test('all 95 API sheets preserve meaningful source contents and valid headers',()=>{
  let count=0;
  for(const workbook of seed.workbooks)for(const input of workbook.sheets){
    const before=JSON.stringify(input);
    assert.deepEqual(auditSheet(normalizeSheet(input)).problems,[],`${workbook.file} / ${input.name}`);
    assert.equal(JSON.stringify(input),before);
    count++;
  }
  assert.equal(count,95);
});
