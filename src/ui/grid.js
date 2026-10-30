/** Glyph grid: cards, filters and counts. */

import { el } from '../lib/dom.js';
import { codeLabel, makeGlyphSvg, ruleFor, variantOf } from '../lib/glyph.js';
import { matches, sortedGlyphs } from '../lib/search.js';
import { STRINGS } from '../lib/strings.js';
import { formatNumber, unicodeLabel } from '../lib/text.js';

export const MAX_RENDER = 2000;

export const createGrid = (ctx) => {
  const { state, els } = ctx;

  const makeCard = (glyph) => {
    const card = el('button', 'glyph-card');
    card.type = 'button';
    card.dataset.id = String(glyph.id);
    card.title = glyph.name + '\n' + unicodeLabel(glyph) + '\n' + ruleFor(glyph, ctx.prefix());
    card.setAttribute('aria-label', 'Open details for ' + glyph.name + ', ' + unicodeLabel(glyph));

    const variant = variantOf(glyph.name);
    if (variant) card.appendChild(el('span', 'variant', variant));

    const box = el('span', 'glyph-box');
    box.appendChild(makeGlyphSvg(glyph, ctx.metrics()));
    card.appendChild(box);
    card.appendChild(el('span', 'glyph-name', glyph.name));
    card.appendChild(el('span', 'glyph-code', codeLabel(glyph)));
    return card;
  };

  const updateCount = () => {
    const total = state.glyphs.length;
    if (!state.query) {
      els.resultCount.textContent = STRINGS.results.glyphs(formatNumber(total));
    } else {
      els.resultCount.textContent = STRINGS.results.filtered(formatNumber(state.filtered.length), formatNumber(total));
    }
  };

  const render = () => {
    const matched = state.glyphs.filter((glyph) => matches(glyph, state.query, ctx.prefix()));
    state.filtered = sortedGlyphs(matched, state.sort);
    updateCount();

    const shown = state.filtered.slice(0, MAX_RENDER);
    const fragment = document.createDocumentFragment();
    shown.forEach((glyph) => fragment.appendChild(makeCard(glyph)));
    els.grid.replaceChildren(fragment);

    els.empty.hidden = shown.length > 0;
    els.emptyQuery.textContent = '\u201c' + state.query + '\u201d';
    els.limitNote.hidden = state.filtered.length <= MAX_RENDER;
    if (state.filtered.length > MAX_RENDER) {
      els.limitNote.textContent = STRINGS.limit(formatNumber(MAX_RENDER), formatNumber(state.filtered.length));
    }
  };

  return { render, updateCount, makeCard };
};
