const ERROR_PATTERN = /^#(DIV\/0!|N\/A|VALUE!|REF!|NAME\?|NULL!|NUM!|GETTING_DATA|SPILL!|CALC!)$/i;
export const ERROR_PLACEHOLDER = '-';
export function sanitizeText(value) {
  return value == null ? '' : String(value).replace(/[\s\u00a0]+/g, ' ').trim();
}
export function isExcelError(value) { return ERROR_PATTERN.test(sanitizeText(value)); }
export function cellValue(cell) {
  if (cell == null) return null;
  if (typeof cell !== 'object') return cell;
  if (cell.t === 'error' || (cell.t === 'formula' && (cell.calc == null || isExcelError(cell.calc)))) return null;
  return cell.t === 'formula' ? cell.calc : cell.v;
}
export function isUnavailableCell(cell) {
  return cell?.t === 'error' || (cell?.t === 'formula' && cellValue(cell) == null) || isExcelError(cellValue(cell));
}
export function displayCell(cell) {
  return isUnavailableCell(cell) ? ERROR_PLACEHOLDER : sanitizeText(cellValue(cell));
}
export function hasContent(cell) {
  const value = cellValue(cell);
  return value != null && !isExcelError(value) && sanitizeText(value) !== '' && !/^[.\u2026\u00b7_\s—-]+$/.test(sanitizeText(value));
}
export function isNumericCell(cell) {
  return hasContent(cell) && (typeof cellValue(cell) === 'number' || /^[+-]?\d+([.,]\d+)*%?$/.test(sanitizeText(cellValue(cell))));
}
const numberFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 6 });
export function formatCell(cell) {
  if (!hasContent(cell)) return ERROR_PLACEHOLDER;
  const value = cellValue(cell);
  return typeof value === 'number' ? numberFormat.format(value) : sanitizeText(value);
}
export function cellClassName(cell) { return isNumericCell(cell) ? 'numeric-cell' : ''; }
