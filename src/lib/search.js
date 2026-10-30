/** Search and sort over the glyph list. Pure functions, unit tested. */

import { cssClass, codeLabel } from './glyph.js';
import { unicodeLabel } from './text.js';

export const haystack = (glyph, prefix) =>
  [
    glyph.name,
    unicodeLabel(glyph),
    glyph.cps.map((cp) => cp.toString(16)).join(' '),
    glyph.cps.map((cp) => String(cp)).join(' '),
    cssClass(glyph, prefix),
    codeLabel(glyph),
    String.fromCodePoint(...glyph.cps),
  ]
    .join(' ')
    .toLowerCase()
    .replace(/[-_]+/g, ' ');

const normalize = (query) =>
  String(query || '')
    .toLowerCase()
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');

export const matches = (glyph, query, prefix) => {
  if (!query) return true;
  const needle = normalize(query);
  if (!needle) return true;
  return haystack(glyph, prefix).replace(/\s+/g, ' ').includes(needle);
};

export const sortedGlyphs = (glyphs, sort) => {
  const list = glyphs.slice();
  if (sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' }) || a.cp - b.cp);
  } else if (sort === 'code') {
    list.sort((a, b) => a.cp - b.cp || a.name.localeCompare(b.name, 'en', { numeric: true }));
  } else {
    list.sort((a, b) => a.order - b.order);
  }
  return list;
};
