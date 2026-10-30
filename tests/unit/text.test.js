import { describe, expect, it } from 'vitest';
import {
  cleanFamily,
  cleanVersion,
  baseName,
  extOf,
  csvCell,
  formatMetric,
  formatNumber,
  normalizeMetrics,
  sanitizePrefix,
  slugify,
  unicodeLabel,
} from '../../src/lib/text.js';

describe('slugify', () => {
  it('normalizes separators and case', () => {
    expect(slugify('arrow-right_4pt')).toBe('arrow-right-4pt');
    expect(slugify('  CMS_2PT ')).toBe('cms-2pt');
  });

  it('strips accents and non-ascii characters', () => {
    expect(slugify('Ícone Olá')).toBe('icone-ola');
    expect(slugify('图标')).toBe('');
  });

  it('collapses runs of punctuation', () => {
    expect(slugify('a...b//c')).toBe('a-b-c');
    expect(slugify('--edge--')).toBe('edge');
  });
});

describe('sanitizePrefix', () => {
  it('falls back to icon', () => {
    expect(sanitizePrefix('')).toBe('icon');
    expect(sanitizePrefix('   ')).toBe('icon');
    expect(sanitizePrefix('!!!')).toBe('icon');
  });

  it('keeps letters, digits, dashes and underscores', () => {
    expect(sanitizePrefix('glyphary')).toBe('glyphary');
    expect(sanitizePrefix('test_icons')).toBe('test_icons');
  });

  it('never starts with a digit', () => {
    expect(sanitizePrefix('9 bad prefix!')).toBe('i-9-bad-prefix');
  });
});

describe('small text helpers', () => {
  it('cleanFamily removes wrapping quotes', () => {
    expect(cleanFamily('"Demo Icons"')).toBe('Demo Icons');
    expect(cleanFamily("'My Font'")).toBe('My Font');
    expect(cleanFamily('  plain  ')).toBe('plain');
  });

  it('cleanVersion drops a leading "Version"', () => {
    expect(cleanVersion('Version 1.000')).toBe('1.000');
    expect(cleanVersion('v2.006')).toBe('v2.006');
  });

  it('baseName and extOf', () => {
    expect(baseName('demo.woff2')).toBe('demo');
    expect(baseName('no-extension')).toBe('no-extension');
    expect(extOf('font.WOFF2')).toBe('WOFF2');
    expect(extOf('font')).toBe('');
  });

  it('formatMetric uses a real minus sign', () => {
    expect(formatMetric(-64)).toBe('\u221264');
    expect(formatMetric(960)).toBe('960');
    expect(formatMetric(-0)).toBe('0');
  });

  it('formatNumber is en-US', () => {
    expect(formatNumber(2757)).toBe('2,757');
  });

  it('unicodeLabel pads to four digits', () => {
    expect(unicodeLabel({ cps: [0xe900] })).toBe('U+E900');
    expect(unicodeLabel({ cps: [0x41] })).toBe('U+0041');
  });

  it('csvCell quotes when needed', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('normalizeMetrics keeps sane defaults', () => {
    expect(normalizeMetrics(960, -64, 1024)).toEqual([960, -64]);
    expect(normalizeMetrics(undefined, undefined, 1000)).toEqual([800, -200]);
    expect(normalizeMetrics(-100, -200, 1000)).toEqual([800, -200]);
  });
});
