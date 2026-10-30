import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSvgFont } from '../../src/lib/parse/svg-font.js';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(here, '../fixtures/demo.svg'), 'utf8');

describe('parseSvgFont', () => {
  const set = parseSvgFont(source, 'demo.svg');

  it('reads the family from font-face, falling back to the font id', () => {
    expect(set.meta.family).toBe('Glyphary Demo');
    expect(set.meta.format).toBe('SVG');
  });

  it('reads the metrics', () => {
    expect(set.meta.upem).toBe(1000);
    expect(set.meta.ascent).toBe(1000);
    expect(set.meta.descent).toBe(0);
  });

  it('extracts every named glyph and skips the space', () => {
    expect(set.glyphs).toHaveLength(25);
    expect(set.glyphs[0]).toMatchObject({ cp: 0xe900, name: 'house', adv: 1000 });
    expect(set.glyphs[24]).toMatchObject({ cp: 0xe918, name: 'moon' });
    expect(set.glyphs.some((g) => g.cp === 0x20)).toBe(false);
  });

  it('keeps file order and paths', () => {
    expect(set.glyphs.map((g) => g.order)).toEqual(set.glyphs.map((_, i) => i));
    expect(set.glyphs[0].d.startsWith('M544.1875 906.25')).toBe(true);
  });

  it('falls back to uniXXXX names when glyph-name is missing', () => {
    const custom = source.replace('glyph-name="house"', '');
    expect(parseSvgFont(custom, 'x.svg').glyphs[0].name).toBe('uniE900');
  });

  it('prefers font-face font-family over the font id', () => {
    const custom = source
      .replace('<font id="GlypharyDemo"', '<font id="internal"')
      .replace('font-family="Glyphary Demo"', 'font-family="Demo Icons"');
    expect(parseSvgFont(custom, 'x.svg').meta.family).toBe('Demo Icons');
  });

  it('rejects XML that is not well formed', () => {
    expect(() => parseSvgFont('<svg><font><glyph unicode="&#xe900;" d="M0 0"/></svg>', 'x.svg')).toThrow(
      /well formed/i,
    );
  });

  it('rejects an icon svg without a font element', () => {
    expect(() => parseSvgFont('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>', 'x.svg')).toThrow(
      /<font>/,
    );
  });

  it('rejects a font element without usable glyphs', () => {
    const empty = '<svg><font id="x"><font-face units-per-em="1000"/><glyph unicode=" " d=""/></font></svg>';
    expect(() => parseSvgFont(empty, 'x.svg')).toThrow(/no glyphs/i);
  });
});
