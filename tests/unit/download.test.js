import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke, save } = vi.hoisted(() => ({ invoke: vi.fn(), save: vi.fn() }));

vi.mock('@tauri-apps/plugin-dialog', () => ({ save }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

import { downloadText } from '../../src/lib/download.js';

describe('downloadText inside Tauri', () => {
  beforeEach(() => {
    save.mockReset().mockResolvedValue('/tmp/glyphary-glyphs.css');
    invoke.mockReset().mockResolvedValue(undefined);
    window.__TAURI_INTERNALS__ = {};
  });

  afterEach(() => {
    delete window.__TAURI_INTERNALS__;
  });

  it('asks for a path and writes the file through the native command', async () => {
    await downloadText('glyphary-glyphs.css', 'body {}', 'text/css');

    expect(save).toHaveBeenCalledWith({
      defaultPath: 'glyphary-glyphs.css',
      filters: [{ name: 'CSS', extensions: ['css'] }],
    });
    expect(invoke).toHaveBeenCalledWith('save_export', {
      path: '/tmp/glyphary-glyphs.css',
      contents: 'body {}',
    });
  });

  it('writes nothing when the save dialog is cancelled', async () => {
    save.mockResolvedValue(null);

    await downloadText('glyphary-glyphs.csv', 'a,b', 'text/csv');

    expect(invoke).not.toHaveBeenCalled();
  });
});
