// Normalisasi data sumber Excel sebelum disajikan.
// Menghapus padding kosong di tepi (baris/kolom kosong di ekor) tanpa mengubah
// indeks sel mana pun yang berisi data, sehingga override di db.json tetap aman.

function cellText(cell) {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'object') {
    const value = cell.t === 'formula' && cell.calc !== null && cell.calc !== undefined ? cell.calc : cell.v;
    return value === null || value === undefined ? '' : String(value);
  }
  return String(cell);
}

function isBlank(cell) {
  return cellText(cell).trim() === '';
}

function normalizeSheet(sheet) {
  const rows = Array.isArray(sheet.rows) ? sheet.rows : [];
  let lastRow = -1;
  for (let r = rows.length - 1; r >= 0; r--) {
    const row = rows[r];
    if (row && row.some((cell) => !isBlank(cell))) { lastRow = r; break; }
  }

  const kept = lastRow < 0 ? [] : rows.slice(0, lastRow + 1);
  const width = Math.max(0, ...kept.map((row) => (row ? row.length : 0)));
  let lastCol = -1;
  for (let c = width - 1; c >= 0; c--) {
    let filled = false;
    for (const row of kept) {
      if (!isBlank(row[c])) { filled = true; break; }
    }
    if (filled) { lastCol = c; break; }
  }

  const maxCol = lastCol < 0 ? 0 : lastCol + 1;
  const trimmedRows = kept.map((row) => {
    const out = new Array(maxCol).fill(null);
    for (let c = 0; c < maxCol; c++) out[c] = row[c] === undefined ? null : row[c];
    return out;
  });

  const merged = Array.isArray(sheet.mergedRanges) ? sheet.mergedRanges : [];
  const keptMerges = merged.filter((range) => {
    const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(String(range));
    if (!m) return false;
    const colOf = (letters) => letters.split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
    // A header may span reporting periods with no values yet. Retain merges
    // intersecting the used grid so its year/metric remains available.
    return colOf(m[1]) <= lastCol && Number(m[2]) - 1 <= lastRow;
  });

  return {
    id: sheet.id,
    name: sheet.name,
    rows: trimmedRows,
    maxRow: trimmedRows.length,
    maxCol,
    mergedRanges: keptMerges,
  };
}

function normalizeWorkbook(workbook) {
  return {
    ...workbook,
    sheets: (Array.isArray(workbook.sheets) ? workbook.sheets : []).map(normalizeSheet),
  };
}

function normalizeSeed(seed) {
  return { ...seed, workbooks: (seed.workbooks || []).map(normalizeWorkbook) };
}

module.exports = { cellText, isBlank, normalizeSheet, normalizeWorkbook, normalizeSeed };
