/** SVG font (`<font>` element) parser, e.g. IcoMoon or FontForge exports. */

import { STRINGS } from '../strings.js';
import { baseName, cleanFamily, cleanText, normalizeMetrics, positiveNum } from '../text.js';
import { inputError, isBlankCodePoint } from './shared.js';

export const parseSvgFont = (text, filename) => {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw inputError(STRINGS.parser.svgMalformed);

  const fontEl = doc.querySelector('font');
  if (!fontEl) throw inputError(STRINGS.parser.svgNoFont);

  const face = fontEl.querySelector('font-face') || doc.querySelector('font-face');
  const upem = positiveNum(face && face.getAttribute('units-per-em'), 1000);
  const [ascent, descent] = normalizeMetrics(
    face && face.getAttribute('ascent'),
    face && face.getAttribute('descent'),
    upem,
  );
  const defaultAdvance = positiveNum(fontEl.getAttribute('horiz-adv-x'), upem);
  const glyphs = [];

  for (const node of fontEl.querySelectorAll('glyph')) {
    const unicode = node.getAttribute('unicode');
    if (!unicode) continue;

    const cps = [...unicode].map((character) => character.codePointAt(0)).filter((cp) => !isBlankCodePoint(cp));
    if (!cps.length) continue;

    const d = (node.getAttribute('d') || '').trim();
    if (!d || /NaN|Infinity/.test(d)) continue;

    const advance = positiveNum(node.getAttribute('horiz-adv-x'), defaultAdvance);
    const name =
      cleanText(node.getAttribute('glyph-name')) ||
      cps.map((cp) => 'uni' + cp.toString(16).toUpperCase().padStart(4, '0')).join('-');

    glyphs.push({
      cp: cps[0],
      cps,
      name,
      d,
      adv: advance,
      bbox: null,
      gid: null,
      order: glyphs.length,
    });
  }

  if (!glyphs.length) throw inputError(STRINGS.parser.svgNoGlyphs);

  return {
    glyphs,
    meta: {
      family:
        cleanFamily(face && face.getAttribute('font-family')) ||
        cleanFamily(fontEl.getAttribute('id')) ||
        baseName(filename) ||
        STRINGS.untitledFont,
      subfamily: '',
      version: '',
      format: 'SVG',
      upem,
      ascent,
      descent,
      filename,
      glyphCount: glyphs.length,
    },
  };
};
