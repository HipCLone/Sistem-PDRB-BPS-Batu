import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {quarterStatus} from '../src/lib/quarterStatus.mjs';
import {currentReportingPeriod} from '../src/lib/periods.mjs';

test('current quarter and year follow Jakarta at period boundaries',()=>{
  assert.deepEqual(currentReportingPeriod(new Date('2026-03-31T16:59:59Z')),{year:'2026',quarter:1});
  assert.deepEqual(currentReportingPeriod(new Date('2026-03-31T17:00:00Z')),{year:'2026',quarter:2});
  assert.deepEqual(currentReportingPeriod(new Date('2026-12-31T17:00:00Z')),{year:'2027',quarter:1});
});

const sheet=(id,rows,name='Laporan')=>({id,name,rows,maxCol:Math.max(...rows.map(row=>row.length)),maxRow:rows.length,manualHeaders:true,mergedRanges:[]});
const workbook=(sheets,extra={})=>({id:'fixture',file:'data.xlsx',institution:'BULOG',sheets,...extra});
const states=(w,year='2026')=>quarterStatus(w,year).map(q=>q.status);

test('quarter status follows actual values independently, including zero and saved formula result',()=>{
  const s=sheet('s',[['Komoditas','2026 TW 1','2026 TW 2','2026 TW 3','2026 TW 4'],['Padi',0,null,{t:'formula',v:'=A1',calc:10},{t:'formula',v:'=A2',calc:null}]]);
  assert.deepEqual(states(workbook([s])),['filled','empty','filled','empty']);
  s.rows[1][2]=21;assert.deepEqual(states(workbook([s])),['filled','filled','filled','empty']);
  s.rows[1][2]='Sudah tersedia';assert.deepEqual(states(workbook([s])),['filled','filled','filled','empty']);
  s.rows[1][2]='Belum tersedia';assert.deepEqual(states(workbook([s])),['filled','empty','filled','empty']);
  s.rows[1][2]=21;
  s.rows[1][0]='Jagung';s.rows[1][1]=null;assert.deepEqual(states(workbook([s])),['empty','filled','filled','empty']);
  assert.deepEqual(states(workbook([s]),'2025'),['empty','empty','empty','empty']);
});
test('reporting metadata and monthly sheets apply only to meaningful data, never row descriptions or annual budgets',()=>{
  const s=sheet('s',[['Jenis','Anggaran','Nilai'],['Pajak',100,null]]);
  const w=workbook([s],{reportingYear:'2026',reportingQuarter:'2'});
  assert.deepEqual(states(w),['empty','empty','empty','empty']);
  s.rows[1][2]=0;assert.deepEqual(states(w),['empty','filled','empty','empty']);
  const jan=sheet('a',[['Jenis','Realisasi 2026'],['Pajak',12]],'JAN 26');
  const april=sheet('b',[['Jenis','Realisasi 2026'],['Pajak',7]],'April 2026');
  assert.deepEqual(states(workbook([jan,april])),['filled','filled','empty','empty']);
  assert.deepEqual(states(workbook([jan,april],{reportingYear:'2026',reportingQuarter:'3'})),['filled','filled','empty','empty']);
});
test('period labels without a year are not silently assigned, and unavailable results are not values',()=>{
  const missing=sheet('s',[['Indikator','TW 1'],['Beras',25]]);
  assert.deepEqual(states(workbook([missing])),['unknown','unknown','unknown','unknown']);
  const unavailable=sheet('s',[['Indikator','2026 TW 1'],['Beras',{t:'error',v:'#DIV/0!'}]]);
  assert.deepEqual(states(workbook([unavailable])),['empty','empty','empty','empty']);
});
test('a year in the data row can identify a quarter column',()=>{
  const s=sheet('rows',[['Tahun','Komoditas','TW 1','TW 2'],[2026,'Beras',8,null],[2025,'Beras',null,6]]);
  assert.deepEqual(states(workbook([s]),'2026'),['filled','empty','empty','empty']);
  assert.deepEqual(states(workbook([s]),'2025'),['empty','filled','empty','empty']);
});
test('calculated growth does not count if its referenced input is empty',()=>{
  const s=sheet('growth',[['Indikator','2026 TW 1','2026 TW 2','2026 TW 3'],['Padi',100,null,{t:'formula',v:'=C2/B2*100-100',calc:-100}]]);
  assert.deepEqual(states(workbook([s])),['filled','empty','empty','empty']);
  s.rows[1][2]=0;assert.deepEqual(states(workbook([s])),['filled','filled','filled','empty']);
  s.rows[1][3]={t:'formula',v:'=OtherSheet!A1',calc:10};assert.deepEqual(states(workbook([s])),['filled','filled','unknown','empty']);
  const source=JSON.parse(fs.readFileSync(new URL('../backend/data/workbooks.json',import.meta.url),'utf8')).workbooks.find(w=>w.id==='a-dinas-pertanian');
  assert.equal(states({...source,sheets:[source.sheets[0]]})[2],'empty');
});
test('same institution datasets remain independent and existing real BULOG quarterly data is recognized',()=>{
  const empty=workbook([sheet('empty',[['Indikator','2026 TW 1'],['Beras',null]])]);
  const filled=workbook([sheet('filled',[['Indikator','2026 TW 1'],['Beras',100]])]);
  assert.equal(states(empty)[0],'empty');assert.equal(states(filled)[0],'filled');
  const source=JSON.parse(fs.readFileSync(new URL('../backend/data/workbooks.json',import.meta.url),'utf8')).workbooks.find(w=>w.id==='1-pi-bulog');
  assert.deepEqual(states(source),['filled','filled','empty','empty']);
});
test('deleted rows and columns do not make a period appear filled',()=>{
  const s=sheet('deleted',[['Indikator','2026 TW 1','2026 TW 2'],['Padi',10,20]]);
  s.tableState={'blok-1':{deletedRows:[1]}};assert.deepEqual(states(workbook([s])),['empty','empty','empty','empty']);
  s.tableState={'blok-1':{deletedColumns:[1]}};assert.deepEqual(states(workbook([s])),['empty','filled','empty','empty']);
});
