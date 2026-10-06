import fs from 'node:fs';
import { detectBlocks, displayCell } from '../src/lib/format.js';

const seed = JSON.parse(fs.readFileSync('backend/data/workbooks.json', 'utf8'));
for (const workbook of seed.workbooks) {
  if (process.argv[3] && !new RegExp(process.argv[3], 'i').test(workbook.file)) continue;
  console.log('WORKBOOK ' + workbook.file);
  for (const sheet of workbook.sheets) {
    if (process.argv[2] === 'compact') {
      console.log(JSON.stringify({id:sheet.id,sheet:sheet.name,rows:sheet.rows.length,
        candidates:sheet.rows.map((row,index)=>({index,cells:row.map((cell,col)=>({cell,col}))
          .filter(({cell})=>displayCell(cell) && cell?.t!=='number' && cell?.t!=='formula' && cell?.t!=='error')
          .map(({cell,col})=>`${col}:${displayCell(cell).slice(0,90)}`)}))
          .filter(row=>row.cells.length && (row.index<7 || /Komoditas|Golongan|Nama Unit|Keterangan|Sektor|Produk|Kategori|Jenis Belanja|Distribusi|Produksi|Anggaran|Volume|Jumlah|Rata-Rata/.test(row.cells.join(' '))))
          .map(row=>({...row,cells:row.cells.slice(0,4)}))}));
      continue;
    }
    console.log(JSON.stringify({
      sheet: sheet.name,
      rows: sheet.rows.length,
      merges: sheet.mergedRanges?.filter(range => /[A-Z]+[1-6]:/.test(range)),
      blocks: detectBlocks(sheet).map(block => ({
        h: block.headerRows, r: block.rowIndexes.length, c: block.columns, labels: block.labels,
      })),
      preview: sheet.rows.map((row, index) => [index, row.map((cell, col) => displayCell(cell) ? `${col}:${displayCell(cell)}` : '').filter(Boolean)])
        .filter(([, cells]) => cells.length).slice(0, Number(process.argv[2]) || 9),
    }));
  }
}
