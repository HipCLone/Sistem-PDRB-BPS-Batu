import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { detectBlocks, mergedValue, columnLetter } from '../src/lib/sheetPresentation.mjs';
import { hasContent, isUnavailableCell } from '../src/lib/cells.mjs';
const require=createRequire(import.meta.url);
const XLSX=require('xlsx');
const {normalizeSheet}=require('../backend/clean.js');
const root=fileURLToPath(new URL('../',import.meta.url));
const seed=JSON.parse(fs.readFileSync(path.join(root,'backend/data/workbooks.json'),'utf8'));

function sourceSheet(ws, id, name) {
  const entries=Object.entries(ws).filter(([address,cell])=>/^[A-Z]+\d+$/.test(address)&&(cell.v!=null||cell.f));
  let height=0,width=0;
  for(const [address] of entries){const {r,c}=XLSX.utils.decode_cell(address);height=Math.max(height,r+1);width=Math.max(width,c+1);}
  const rows=Array.from({length:height},()=>Array(width).fill(null));
  for(const [address,cell] of entries){
    const {r,c}=XLSX.utils.decode_cell(address);
    rows[r][c]={v:cell.f?`=${cell.f}`:cell.t==='e'?(cell.w||'#VALUE!'):cell.v,
      t:cell.t==='e'?'error':cell.f?'formula':cell.t==='n'?'number':'string',calc:cell.f&&cell.t!=='e'?cell.v??null:null,fmt:cell.z||'General'};
  }
  return normalizeSheet({id,name,rows,maxCol:width,mergedRanges:(ws['!merges']||[]).map(m=>XLSX.utils.encode_range(m))});
}

export function auditSheet(sheet) {
  const blocks=detectBlocks(sheet), problems=[];
  const issue=text=>problems.push(text);
  for(const block of blocks){
    if(block.labels.some(label=>!label.trim())) issue(`${block.id}: judul kolom kosong`);
    if(new Set(block.labels).size!==block.labels.length) issue(`${block.id}: judul kolom ambigu`);
    for(const r of block.headerRows) for(let c=block.sourceRange.from;c<=block.sourceRange.to;c++) {
      const cell=sheet.rows[r]?.[c];
      if(cell?.t==='formula'||isUnavailableCell(cell)) issue(`${block.id}: rumus/error dijadikan header ${columnLetter(c)}${r+1}`);
      if(cell?.t==='number'&&hasContent(cell)&&! /^(?:19|20)\d{2}$|^[1-4]$/.test(String(cell.v))) issue(`${block.id}: nilai numerik dijadikan header ${columnLetter(c)}${r+1}`);
    }
    for(const c of block.columns) if(!block.rowIndexes.some(r=>!block.sectionRows.includes(r)&&hasContent(mergedValue(sheet,r,c)))) issue(`${block.id}: kolom kosong ${c}`);
    for(const r of block.rowIndexes) if(!block.sectionRows.includes(r)&&!block.columns.some(c=>hasContent(mergedValue(sheet,r,c)))) issue(`${block.id}: baris kosong ${r}`);
  }
  // Each meaningful source cell must be visible, a real header, source note,
  // section heading, or an explicitly classified numbered template/guide row.
  sheet.rows.forEach((row,r)=>row.forEach((cell,c)=>{
    if(!hasContent(cell))return;
    const represented=blocks.some(b=>c>=b.sourceRange.from&&c<=b.sourceRange.to&&(
      b.headerRows.includes(r)||b.noteRows.includes(r)||b.placeholderRows.includes(r)||b.guideRows.includes(r)||
      (b.rowIndexes.includes(r)&&(b.columns.includes(c)||b.sectionRows.includes(r)))
    ));
    if(!represented)issue(`Isi sumber tersembunyi: ${columnLetter(c)}${r+1}`);
  }));
  return {blocks,problems};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=['# Audit penyajian Excel','',
    'Pemeriksaan per sheet pada file asli di `source-excel/` dan data yang digunakan API. Tidak menulis ulang nilai sumber.',
    '', 'Kolom sumber tanpa judul diberi label berbasis koordinat, bukan dugaan satuan. Error/rumus tanpa cached value ditandai tidak tersedia. Baris bernomor saja, titik-titik contoh, dan seluruh baris/kolom kosong tidak disajikan sebagai data.',
    '', '| File / sheet | Tabel | Baris tampil | Kolom tanpa judul sumber | Sel rumus/error tidak tersedia (API) | Status |',
    '|---|---:|---:|---:|---:|---|'];
  const failures=[];
  let sheetCount=0,blockCount=0;
  for(const workbook of seed.workbooks){
    const original=XLSX.readFile(path.join(root,'source-excel',workbook.file),{cellFormula:true,cellNF:true});
    assert.equal(original.SheetNames.length,workbook.sheets.length,`${workbook.file}: sheet hilang`);
    for(const sheet of workbook.sheets){
      sheetCount++;
      assert(original.Sheets[sheet.name],`${workbook.file}: ${sheet.name} tidak ada di Excel asli`);
      const source=sourceSheet(original.Sheets[sheet.name],sheet.id,sheet.name);
      const originalAudit=auditSheet(source), currentAudit=auditSheet(normalizeSheet(sheet));
      for(const [kind,audit] of [['asli',originalAudit],['API',currentAudit]])for(const problem of audit.problems)failures.push(`${workbook.file} / ${sheet.name} (${kind}): ${problem}`);
      const blocks=currentAudit.blocks;
      if(sheet.rows.length&&!blocks.every(b=>b.reviewed))failures.push(`${sheet.id}: belum memiliki profil yang diperiksa`);
      blockCount+=blocks.length;
      const rowCount=blocks.reduce((n,b)=>n+b.rowIndexes.length,0);
      const missing=blocks.reduce((n,b)=>n+b.unlabelledColumns.length,0);
      const unavailable=blocks.reduce((n,b)=>n+b.unavailableCount,0);
      const state=!sheet.rows.length?'Sheet kosong':!rowCount?'Template belum diisi':blocks.every(b=>b.isTemplate)?'Indikator belum diisi':'Data tersedia';
      report.push(`| ${workbook.file.replaceAll('|','/')} / ${sheet.name.replaceAll('|','/')} | ${blocks.length} | ${rowCount} | ${missing} | ${unavailable} | ${state} |`);
    }
  }
  report.push('',`Total: ${seed.workbooks.length} workbook, ${sheetCount} sheet, ${blockCount} tabel.`, '',`Hasil validasi: ${failures.length?failures.length+' masalah':'lulus; tidak ada judul kosong, baris/kolom kosong yang tampil, atau isi sumber yang tidak terklasifikasi.'}`);
  if(failures.length)report.push('',...failures.map(f=>'- '+f));
  if(process.argv.includes('--report')){
    fs.mkdirSync(path.join(root,'docs'),{recursive:true});
    fs.writeFileSync(path.join(root,'docs/excel-audit.md'),report.join('\n')+'\n');
  }
  console.log(`${seed.workbooks.length} workbook / ${sheetCount} sheet / ${blockCount} tables / ${failures.length} issues`);
  if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
}
