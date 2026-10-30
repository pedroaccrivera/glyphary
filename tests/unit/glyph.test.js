import { describe, expect, it } from 'vitest';
import { codeLabel, cssClass, cssContent, prepareGlyphs, ruleFor, variantOf, viewBoxFor } from '../../src/lib/glyph.js';

const glyph = (over = {}) => ({
  cp: 0xe900,
  cps: [0xe900],
  name: 'arrow-right_4pt',
  d: 'M0 0L10 10',
  adv: 1024,
  bbox: { minX: 0, minY: 96, maxX: 1025, maxY: 768 },
  gid: 1,
  order: 0,
  ...over,
});

const metrics = { upem: 1024, ascent: 960, descent: -64 };

describe('cssContent', () => {
  it('escapes BMP code points', () => {
    expect(cssContent(glyph())).toBe('\\e900');
  });

  it('keeps a space after astral escapes', () => {
    expect(cssContent(glyph({ cps: [0x1f600] }))).toBe('\\1f600 ');
  });

  it('concatenates ligatures', () => {
    expect(cssContent(glyph({ cps: [0x66, 0x69] }))).toBe('\\66\\69');
  });
});

describe('cssClass and ruleFor', () => {
  it('joins prefix and slug', () => {
    const g = glyph();
    g.slug = 'arrow-right-4pt';
    expect(cssClass(g, 'icon')).toBe('icon-arrow-right-4pt');
    expect(ruleFor(g, 'icon')).toBe('.icon-arrow-right-4pt::before { content: "\\e900"; }');
  });
});

describe('variantOf', () => {
  it('reads the size suffix', () => {
    expect(variantOf('arrow-right_4pt')).toBe('4 pt');
    expect(variantOf('cms_2PT')).toBe('2 pt');
    expect(variantOf('utility_solid')).toBe('');
  });
});

describe('prepareGlyphs', () => {
  it('assigns unique slugs and keeps file order ids', () => {
    const list = prepareGlyphs([
      { cp: 0xe900, name: 'home_2pt' },
      { cp: 0xe901, name: 'home_2pt' },
      { cp: 0xe902, name: '图标' },
    ]);
    expect(list.map((g) => g.id)).toEqual([0, 1, 2]);
    expect(list[0].slug).toBe('home-2pt');
    expect(list[1].slug).toBe('home-2pt-e901');
    expect(list[2].slug).toBe('unie902');
    expect(new Set(list.map((g) => g.slug)).size).toBe(3);
  });
});

describe('viewBoxFor', () => {
  it('covers the em box and the glyph bbox', () => {
    expect(viewBoxFor(glyph(), metrics)).toBe('-6.14 -966.14 1037.29 1036.29');
  });

  it('falls back to the metrics when there is no bbox (SVG fonts)', () => {
    const box = viewBoxFor(glyph({ bbox: null, adv: 1024 }), metrics)
      .split(' ')
      .map(Number);
    expect(box[0]).toBeLessThan(0);
    expect(box[2]).toBeGreaterThan(1024);
    expect(box[3]).toBeGreaterThan(1024);
  });
});

describe('codeLabel', () => {
  it('renders the backslash form shown on cards', () => {
    expect(codeLabel(glyph())).toBe('\\e900');
  });
});
