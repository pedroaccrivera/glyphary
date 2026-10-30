/** Glyph-level helpers: slugs, CSS rules, SVG generation. Pure functions. */

import { svgEl } from './dom.js';
import { fx, hexOf, slugify } from './text.js';

/** Escape a code point as a CSS `content` value. */
export const cssContent = (glyph) =>
  glyph.cps
    .map((cp) => {
      const escaped = '\\' + cp.toString(16).toLowerCase();
      return cp > 0xffff ? escaped + ' ' : escaped;
    })
    .join('');

export const cssClass = (glyph, prefix) => prefix + '-' + glyph.slug;

export const ruleFor = (glyph, prefix) =>
  '.' + cssClass(glyph, prefix) + '::before { content: "' + cssContent(glyph) + '"; }';

export const variantOf = (name) => {
  const match = String(name || '').match(/(?:^|[_-])(\d+)\s*pt$/i);
  return match ? match[1] + ' pt' : '';
};

/** Assigns a stable, unique CSS slug to every glyph. */
export const prepareGlyphs = (glyphs) => {
  const used = new Set();
  glyphs.forEach((glyph, index) => {
    glyph.id = index;
    let base = slugify(glyph.name) || 'uni' + glyph.cp.toString(16);
    if (used.has(base)) base += '-' + glyph.cp.toString(16);
    let slug = base;
    let suffix = 2;
    while (used.has(slug)) {
      slug = base + '-' + suffix;
      suffix += 1;
    }
    used.add(slug);
    glyph.slug = slug;
  });
  return glyphs;
};

export const viewBoxFor = (glyph, metrics) => {
  const upem = metrics.upem || 1000;
  const bbox = glyph.bbox;
  const minX = bbox && Number.isFinite(bbox.minX) ? bbox.minX : 0;
  const maxX = bbox && Number.isFinite(bbox.maxX) ? bbox.maxX : upem;
  const minY = bbox && Number.isFinite(bbox.minY) ? bbox.minY : metrics.descent;
  const maxY = bbox && Number.isFinite(bbox.maxY) ? bbox.maxY : metrics.ascent;
  const x0 = Math.min(0, minX);
  const x1 = Math.max(upem, glyph.adv || 0, maxX);
  const y0 = Math.min(metrics.descent, minY);
  const y1 = Math.max(metrics.ascent, maxY);
  const spacing = Math.max(1, (y1 - y0) * 0.006);
  return [fx(x0 - spacing), fx(-y1 - spacing), fx(x1 - x0 + spacing * 2), fx(y1 - y0 + spacing * 2)].join(' ');
};

/** Fontkit emits y-up outlines; the group flips them for SVG. */
export const makeGlyphSvg = (glyph, metrics, size) => {
  const svg = svgEl('svg');
  svg.setAttribute('viewBox', viewBoxFor(glyph, metrics));
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (size) {
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
  }
  const group = svgEl('g');
  group.setAttribute('transform', 'scale(1,-1)');
  const path = svgEl('path');
  path.setAttribute('d', glyph.d);
  path.setAttribute('fill', 'currentColor');
  group.appendChild(path);
  svg.appendChild(group);
  return svg;
};

export const codeLabel = (glyph) => glyph.cps.map((cp) => '\\' + hexOf(cp)).join('');
