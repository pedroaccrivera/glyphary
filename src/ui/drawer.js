/** Glyph detail drawer. */

import { el } from '../lib/dom.js';
import { makeGlyphSvg, ruleFor, variantOf } from '../lib/glyph.js';
import { STRINGS } from '../lib/strings.js';
import { formatNumber, pad, unicodeLabel } from '../lib/text.js';
import { downloadText } from '../lib/download.js';
import { generateGlyphSvg } from '../lib/exports.js';

export const createDrawer = (ctx) => {
  const { state, els } = ctx;

  const fill = () => {
    const glyph = state.glyphs[state.selected];
    if (!glyph) return;

    const index = state.filtered.findIndex((item) => item.id === glyph.id);
    const position = index >= 0 ? index : 0;
    const total = state.filtered.length;

    els.drawerIndex.textContent = STRINGS.drawer.index(pad(position + 1, 3), pad(total, 3));
    els.drawerTitle.textContent = glyph.name;
    const variant = variantOf(glyph.name);
    els.variantBadge.textContent = variant;
    els.variantBadge.hidden = !variant;

    els.preview.replaceChildren(makeGlyphSvg(glyph, ctx.metrics(), 150));
    els.preview.appendChild(el('span', 'preview-label', STRINGS.drawer.preview));

    els.cssRule.textContent = ruleFor(glyph, ctx.prefix());

    const rows = [
      [STRINGS.drawer.unicode, unicodeLabel(glyph)],
      [STRINGS.drawer.decimal, glyph.cps.join(' / ')],
      [STRINGS.drawer.advance, formatNumber(glyph.adv)],
      [
        glyph.gid != null ? STRINGS.drawer.glyphId : STRINGS.drawer.indexLabel,
        String(glyph.gid != null ? glyph.gid : glyph.order + 1),
      ],
    ];
    els.meta.replaceChildren();
    rows.forEach(([label, value]) => {
      const row = el('div');
      row.appendChild(el('dt', null, label));
      row.appendChild(el('dd', null, value));
      els.meta.appendChild(row);
    });

    els.prevBtn.disabled = position <= 0;
    els.nextBtn.disabled = position >= total - 1;
  };

  const scrollTop = () => {
    const body = els.drawer.querySelector('.drawer-body');
    if (body) body.scrollTop = 0;
  };

  const open = (id) => {
    if (!Number.isInteger(id) || !state.glyphs[id]) return;
    state.selected = id;
    fill();
    if (!els.drawer.open) {
      els.drawer.showModal();
      if (ctx.syncScrollLock) ctx.syncScrollLock();
    }
    scrollTop();
  };

  const step = (delta) => {
    const current = state.filtered.findIndex((glyph) => glyph.id === state.selected);
    if (current < 0) return;
    const next = state.filtered[current + delta];
    if (!next) return;
    state.selected = next.id;
    fill();
    scrollTop();
  };

  const close = () => {
    if (els.drawer.open) els.drawer.close();
  };

  const downloadSvg = () => {
    const glyph = state.glyphs[state.selected];
    if (!glyph) return;
    const name = ctx.fileBase() + '-' + glyph.slug + '.svg';
    downloadText(name, generateGlyphSvg(glyph, ctx.metrics()), 'image/svg+xml;charset=utf-8');
  };

  return { open, step, fill, close, downloadSvg, scrollTop };
};
