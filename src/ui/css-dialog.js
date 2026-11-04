/** CSS export dialog: prefix editing, live preview, downloads. */

import { STRINGS } from '../lib/strings.js';
import { formatNumber } from '../lib/text.js';
import { downloadText } from '../lib/download.js';
import { generateCss, generateCsv } from '../lib/exports.js';

export const createCssDialog = (ctx) => {
  const { state, els } = ctx;

  const update = () => {
    const total = state.glyphs.length;
    els.cssMeta.textContent = STRINGS.cssDialog.meta(formatNumber(total), ctx.prefix());
    els.cssOutput.textContent = generateCss(state.glyphs, state.family, ctx.prefix());
    if (els.drawer.open && state.selected >= 0) ctx.ui.drawer.fill();
  };

  const open = () => {
    els.prefixInput.value = state.prefix;
    update();
    if (!els.cssDialog.open) {
      els.cssDialog.showModal();
      if (ctx.syncScrollLock) ctx.syncScrollLock();
    }
    els.cssOutput.parentElement.scrollTop = 0;
    requestAnimationFrame(() => {
      els.prefixInput.focus();
      els.prefixInput.select();
    });
  };

  const close = () => {
    if (els.cssDialog.open) els.cssDialog.close();
  };

  const css = () => generateCss(state.glyphs, state.family, ctx.prefix());

  const save = (filename, text, mime) => {
    downloadText(filename, text, mime).catch(() => {
      ctx.ui.toast.show(STRINGS.toast.saveFailed, true);
    });
  };

  return { open, close, update, css, downloadCss, downloadCsv };

  function downloadCss() {
    save(
      ctx.fileBase() + '-glyphs.css',
      generateCss(state.glyphs, state.family, ctx.prefix()),
      'text/css;charset=utf-8',
    );
  }

  function downloadCsv() {
    save(ctx.fileBase() + '-glyphs.csv', generateCsv(state.glyphs, ctx.prefix()), 'text/csv;charset=utf-8');
  }
};
