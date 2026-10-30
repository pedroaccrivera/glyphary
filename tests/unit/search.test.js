import { describe, expect, it } from 'vitest';
import { prepareGlyphs } from '../../src/lib/glyph.js';
import { matches, sortedGlyphs } from '../../src/lib/search.js';

const glyphs = prepareGlyphs([
  { cp: 0xe900, cps: [0xe900], name: 'arrow-right_4pt', d: 'M0 0L10 10', adv: 1024 },
  { cp: 0xe901, cps: [0xe901], name: 'arrow-right_2pt', d: 'M1 0L10 10', adv: 1024 },
  { cp: 0xea5a, cps: [0xea5a], name: 'home_2pt', d: 'M2 0L10 10', adv: 1024 },
  { cp: 0xea5b, cps: [0xea5b], name: 'home_4pt', d: 'M3 0L10 10', adv: 1024 },
  { cp: 0xe915, cps: [0xe915], name: 'star_4pt', d: 'M4 0L10 10', adv: 1024 },
]);

const names = (list) => list.map((g) => g.name);

describe('matches', () => {
  it('matches everything when the query is empty', () => {
    expect(glyphs.filter((g) => matches(g, '', 'icon'))).toHaveLength(5);
  });

  it('matches by name, ignoring separators', () => {
    expect(matches(glyphs[0], 'arrow right', 'icon')).toBe(true);
    expect(matches(glyphs[0], 'arrow-right', 'icon')).toBe(true);
    expect(matches(glyphs[4], 'home', 'icon')).toBe(false);
  });

  it('matches U+ notation, bare hex and decimal', () => {
    expect(matches(glyphs[2], 'U+EA5A', 'icon')).toBe(true);
    expect(matches(glyphs[2], 'ea5a', 'icon')).toBe(true);
    expect(matches(glyphs[2], String(0xea5a), 'icon')).toBe(true);
    expect(matches(glyphs[2], '\\ea5a', 'icon')).toBe(true);
  });

  it('matches the generated CSS class', () => {
    expect(matches(glyphs[2], 'icon-home-2pt', 'icon')).toBe(true);
    expect(matches(glyphs[2], 'zzz-home-2pt', 'icon')).toBe(false);
  });
});

describe('sortedGlyphs', () => {
  it('sorts by file order by default', () => {
    expect(names(sortedGlyphs(glyphs, 'file'))).toEqual([
      'arrow-right_4pt',
      'arrow-right_2pt',
      'home_2pt',
      'home_4pt',
      'star_4pt',
    ]);
  });

  it('sorts by name with numeric awareness', () => {
    expect(names(sortedGlyphs(glyphs, 'name'))).toEqual([
      'arrow-right_2pt',
      'arrow-right_4pt',
      'home_2pt',
      'home_4pt',
      'star_4pt',
    ]);
  });

  it('sorts by code point', () => {
    expect(names(sortedGlyphs(glyphs, 'code'))[0]).toBe('arrow-right_4pt');
    expect(names(sortedGlyphs(glyphs, 'code')).at(-1)).toBe('home_4pt');
  });

  it('does not mutate the input', () => {
    const before = names(glyphs);
    sortedGlyphs(glyphs, 'name');
    expect(names(glyphs)).toEqual(before);
  });
});
