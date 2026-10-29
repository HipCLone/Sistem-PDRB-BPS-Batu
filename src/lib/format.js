export { ERROR_PLACEHOLDER, displayCell, formatCell, sanitizeText, isExcelError, isNumericCell, cellClassName } from './cells.mjs';
export { detectBlocks, dataColumns } from './sheetPresentation.mjs';

export function parseValue(value) {
  if (value === '') return '';
  return /^[-+]?\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : value;
}
export function periodLabel(workbook) {
  if (!workbook) return 'Periode belum ditentukan';
  if(workbook.periods?.length>1){
    const years=[...new Set(workbook.periods.map(p=>p.year))];
    return years.length>1?`Beberapa periode (${years.join(', ')})`:`Beberapa periode pada ${years[0]}`;
  }
  return workbook.periodQuarter && workbook.periodYear
    ? `${workbook.periodYear} · Triwulan ${workbook.periodQuarter}`
    : workbook.periodYear || 'Periode belum ditentukan';
}
