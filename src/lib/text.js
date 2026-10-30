/** Text, number and naming helpers. Pure functions, unit tested. */

export const cleanText = (value) =>
  String(value == null ? '' : value)
    .replace(/\0/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Font family names often arrive wrapped in quotes. */
export const cleanFamily = (value) =>
  cleanText(value)
    .replace(/^["']+|["']+$/g, '')
    .trim();

export const cleanVersion = (value) => cleanText(value).replace(/^version\s+/i, '');

export const baseName = (filename) => cleanText(filename).replace(/\.[^.]+$/, '');

export const extOf = (filename) => {
  const match = cleanText(filename).match(/\.([^.]+)$/);
  return match ? match[1].toUpperCase() : '';
};

export const slugify = (value) =>
  cleanText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const sanitizePrefix = (value) => {
  let prefix = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!prefix) prefix = 'icon';
  if (/^[0-9]/.test(prefix)) prefix = 'i-' + prefix;
  return prefix;
};

export const positiveNum = (value, fallback) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const normalizeMetrics = (ascent, descent, upem) => {
  let asc = parseFloat(ascent);
  let desc = parseFloat(descent);
  if (!Number.isFinite(asc)) asc = upem * 0.8;
  if (!Number.isFinite(desc)) desc = -upem * 0.2;
  if (asc <= 0 || asc <= desc) {
    asc = upem * 0.8;
    desc = -upem * 0.2;
  }
  return [asc, desc];
};

export const pad = (value, width) => String(value).padStart(width, '0');

export const hexOf = (cp) => cp.toString(16).toLowerCase().padStart(4, '0');

export const unicodeLabel = (glyph) =>
  glyph.cps.map((cp) => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0')).join(' ');

export const formatNumber = (value) => Number(value).toLocaleString('en-US');

export const formatMetric = (value) => {
  const rounded = Math.round(value * 100) / 100;
  return rounded < 0 ? '\u2212' + Math.abs(rounded) : String(rounded);
};

export const fx = (value) => {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? '0' : String(rounded);
};

export const csvCell = (value) => {
  const text = String(value == null ? '' : value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

export const escapeXml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
