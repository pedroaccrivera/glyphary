import { describe, expect, it } from 'vitest';
import { generateGlyphSvg, fileBase, generateCss, generateCsv } from '../../src/lib/exports.js';
import { prepareGlyphs } from '../../src/lib/glyph.js';

const glyphs = prepareGlyphs([
  { cp: 0xe900, cps: [0xe900], name: 'arrow-right_4pt', d: 'M0 0L10 10', adv: 1024, bbox: null, order: 0 },
  { cp: 0xea5a, cps: [0xea5a], name: 'home_2pt', d: 'M1 1', adv: 1024, bbox: null, order: 1 },
]);

const metrics = { upem: 1024, ascent: 960, descent: -64 };

describe('generateCss', () => {
  const css = generateCss(glyphs, 'Demo Icons', 'icon');

  it('writes a header with family, count and prefix', () => {
    expect(css).toContain('Demo Icons — 2 glyphs');
    expect(css).toContain('prefix .icon');
  });

  it('writes one rule per glyph', () => {
    expect(css.match(/\{ content: "\\[0-9a-f]+"; \}/g)).toHaveLength(2);
    expect(css).toContain('.icon-arrow-right-4pt::before { content: "\\e900"; }');
    expect(css).toContain('.icon-home-2pt::before { content: "\\ea5a"; }');
  });

  it('honours the prefix argument', () => {
    expect(generateCss(glyphs, 'Demo', 'glyph')).toContain('.glyph-home-2pt::before');
  });
});

describe('generateCsv', () => {
  const csv = generateCsv(glyphs, 'icon');
  const lines = csv.split('\r\n');

  it('starts with a BOM and the expected header', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(lines[0]).toBe('\ufeffglyph_name,unicode,codepoint_decimal,css_content,css_class');
  });

  it('writes one row per glyph plus a trailing newline', () => {
    expect(lines.filter(Boolean)).toHaveLength(3);
    expect(lines[1]).toBe('arrow-right_4pt,U+E900,59648,\\e900,icon-arrow-right-4pt');
  });
});

describe('fileBase', () => {
  it('slugifies the family', () => {
    expect(fileBase('Demo Icons')).toBe('demo-icons');
  });

  it('falls back to font', () => {
    expect(fileBase('图标')).toBe('font');
  });
});

describe('generateGlyphSvg', () => {
  const svg = generateGlyphSvg(glyphs[0], metrics);

  it('produces a standalone svg with the flipped group', () => {
    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" viewBox="');
    expect(svg).toContain('transform="scale(1,-1)"');
    expect(svg).toContain('d="M0 0L10 10"');
  });

  it('escapes attribute values', () => {
    const svgQuoted = generateGlyphSvg({ ...glyphs[0], d: 'M0 0 "x" & <y>' }, metrics);
    expect(svgQuoted).toContain('&quot;x&quot; &amp; &lt;y>');
  });
});
