/** Binary font parser (WOFF, WOFF2, TTF, OTF) built on fontkit (MIT). */

import * as fontkit from 'fontkit';
import { STRINGS } from '../strings.js';
import { baseName, cleanFamily, cleanText, cleanVersion, normalizeMetrics } from '../text.js';
import { formatFromBytes, inputError, isBlankCodePoint, isKnownFontMagic } from './shared.js';

export const parseBinaryFont = (buffer, filename) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (!isKnownFontMagic(bytes)) throw inputError(STRINGS.parser.notRecognized);

  let font;
  try {
    font = fontkit.create(bytes);
  } catch (cause) {
    const error = inputError(STRINGS.parser.unreadable);
    error.cause = cause;
    throw error;
  }

  const upem = Number(font.unitsPerEm) || 1000;
  const [ascent, descent] = normalizeMetrics(font.ascent, font.descent, upem);
  const format = formatFromBytes(bytes, font);
  const codepoints = Array.from(new Set(font.characterSet || [])).sort((a, b) => a - b);
  const glyphs = [];

  for (const cp of codepoints) {
    if (isBlankCodePoint(cp)) continue;

    let glyph;
    try {
      glyph = font.glyphForCodePoint(cp);
    } catch (error) {
      continue;
    }
    if (!glyph || !glyph.id) continue;

    const bbox = glyph.bbox || null;
    if (bbox && bbox.maxX === bbox.minX && bbox.maxY === bbox.minY) continue;

    let d;
    try {
      d = glyph.path && glyph.path.toSVG();
    } catch (error) {
      continue;
    }
    if (!d || /NaN|Infinity/.test(d)) continue;

    let name = cleanText(glyph.name);
    if (!name || /^glyph\d+$/i.test(name) || name === '.notdef') {
      name = 'uni' + cp.toString(16).toUpperCase().padStart(4, '0');
    }

    glyphs.push({
      cp,
      cps: [cp],
      name,
      d,
      adv: Number(glyph.advanceWidth) || upem,
      bbox,
      gid: glyph.id,
      order: glyphs.length,
    });
  }

  if (!glyphs.length) throw inputError(STRINGS.parser.noVisibleGlyphs);

  return {
    glyphs,
    meta: {
      family: cleanFamily(font.familyName) || baseName(filename) || STRINGS.untitledFont,
      subfamily: cleanText(font.subfamilyName),
      version: cleanVersion(font.version),
      format,
      upem,
      ascent,
      descent,
      filename,
      glyphCount: font.numGlyphs,
    },
  };
};
