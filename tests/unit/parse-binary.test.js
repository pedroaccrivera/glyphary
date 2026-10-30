import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBinaryFont } from '../../src/lib/parse/binary-font.js';
import { formatFromBytes } from '../../src/lib/parse/shared.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (name) => new Uint8Array(readFileSync(resolve(here, '../fixtures/' + name)));

describe('formatFromBytes', () => {
  it('reads the container and the outline flavour', () => {
    expect(formatFromBytes(read('demo.woff2'), null)).toBe('WOFF2');
    expect(formatFromBytes(read('demo.woff'), null)).toBe('WOFF');
    expect(formatFromBytes(read('demo.ttf'), null)).toBe('TTF');
    expect(formatFromBytes(read('demo.otf'), null)).toBe('OTF');
  });

  it('reports OTTO and CFF fonts as OTF', () => {
    const otto = new Uint8Array([0x4f, 0x54, 0x54, 0x4f]);
    expect(formatFromBytes(otto, null)).toBe('OTF');
    const ttfWithCff = new Uint8Array([0, 1, 0, 0]);
    expect(formatFromBytes(ttfWithCff, { directory: { tables: { 'CFF ': {} } } })).toBe('OTF');
  });
});

describe('parseBinaryFont', () => {
  const set = parseBinaryFont(read('demo.woff2'), 'demo.woff2');

  it('reads family, metrics and format', () => {
    expect(set.meta.family).toBe('Glyphary Demo');
    expect(set.meta.subfamily).toBe('Regular');
    expect(set.meta.version).toBe('1.000');
    expect(set.meta.format).toBe('WOFF2');
    expect(set.meta.upem).toBe(1000);
    expect(set.meta.ascent).toBe(1000);
    expect(set.meta.descent).toBe(0);
  });

  it('extracts the 25 icons, skipping space and non-characters', () => {
    expect(set.glyphs).toHaveLength(25);
    expect(set.glyphs[0]).toMatchObject({ cp: 0xe900, name: 'house' });
    expect(set.glyphs[24]).toMatchObject({ cp: 0xe918, name: 'moon' });
    expect(set.glyphs.some((g) => g.cp === 0x20 || g.cp === 0xffff || g.cp === 0xfeff)).toBe(false);
  });

  it('keeps the advance, glyph id and bbox', () => {
    const first = set.glyphs[0];
    expect(first.adv).toBe(1000);
    expect(first.gid).toBeGreaterThan(0);
    expect(first.bbox.maxX).toBeGreaterThan(first.bbox.minX);
    expect(first.bbox.maxY).toBeGreaterThan(first.bbox.minY);
    expect(first.d.startsWith('M')).toBe(true);
  });

  it('parses WOFF, WOFF2, TTF and OTF from the same family', () => {
    for (const file of ['demo.woff', 'demo.woff2', 'demo.ttf', 'demo.otf']) {
      const parsed = parseBinaryFont(read(file), file);
      expect(parsed.meta.family, file).toBe('Glyphary Demo');
      expect(parsed.glyphs, file).toHaveLength(25);
    }
  });

  it('rejects unknown bytes with a user-facing error', () => {
    const bytes = new TextEncoder().encode('this is not a font at all');
    expect(() => parseBinaryFont(bytes, 'bad.woff')).toThrow(/Unrecognized format/);
    try {
      parseBinaryFont(bytes, 'bad.woff');
    } catch (error) {
      expect(error.userFacing).toBe(true);
    }
  });
});
