/** Application controller: state, font loading and event wiring. */

import { $, tick } from '../lib/dom.js';
import { copyText } from '../lib/clipboard.js';
import { fileBase } from '../lib/exports.js';
import { prepareGlyphs, ruleFor } from '../lib/glyph.js';
import { parseFontFile } from '../lib/parse/index.js';
import { STRINGS } from '../lib/strings.js';
import {
  baseName,
  cleanText,
  cleanVersion,
  extOf,
  formatMetric,
  formatNumber,
  normalizeMetrics,
  sanitizePrefix,
} from '../lib/text.js';
import { createCssDialog } from './css-dialog.js';
import { bindDropzone } from './dropzone.js';
import { createDrawer } from './drawer.js';
import { createGrid } from './grid.js';
import { createThemeToggle } from './theme.js';
import { createToast } from './toast.js';

const collectEls = () => ({
  openBtn: $('openBtn'),
  fileInput: $('fileInput'),
  welcome: $('welcome'),
  welcomeOpen: $('welcomeOpen'),
  themeBtn: $('themeBtn'),
  themeLabel: $('themeLabel'),

  fontName: $('fontName'),
  fontSub: $('fontSub'),
  fontFile: $('fontFile'),
  statGlyphs: $('statGlyphs'),
  statUpem: $('statUpem'),
  statMetrics: $('statMetrics'),
  statFormat: $('statFormat'),

  searchInput: $('searchInput'),
  clearSearch: $('clearSearch'),
  resultCount: $('resultCount'),
  sizeRange: $('sizeRange'),
  sizeOut: $('sizeOut'),
  cssBtn: $('cssBtn'),

  grid: $('grid'),
  empty: $('empty'),
  emptyQuery: $('emptyQuery'),
  emptyClear: $('emptyClear'),
  limitNote: $('limitNote'),

  errorBox: $('errorBox'),
  errorMsg: $('errorMsg'),
  closeError: $('closeError'),

  drawer: $('drawer'),
  drawerIndex: $('drawerIndex'),
  drawerTitle: $('drawerTitle'),
  variantBadge: $('variantBadge'),
  preview: $('preview'),
  cssRule: $('cssRule'),
  copyRule: $('copyRule'),
  meta: $('meta'),
  prevBtn: $('prevBtn'),
  nextBtn: $('nextBtn'),
  closeDrawer: $('closeDrawer'),
  copyChar: $('copyChar'),
  downloadSvg: $('downloadSvg'),

  cssDialog: $('cssDialog'),
  closeCss: $('closeCss'),
  prefixInput: $('prefixInput'),
  cssMeta: $('cssMeta'),
  cssOutput: $('cssOutput'),
  copyCss: $('copyCss'),
  downloadCss: $('downloadCss'),
  downloadCsv: $('downloadCsv'),

  busyBar: $('busyBar'),
  toast: $('toast'),
});

const createState = () => ({
  glyphs: [],
  filtered: [],
  family: '',
  subfamily: '',
  version: '',
  format: '',
  upem: 1000,
  ascent: 800,
  descent: -200,
  query: '',
  sort: 'file',
  size: 32,
  prefix: 'icon',
  selected: -1,
  source: '',
  busy: false,
});

export const start = async () => {
  const els = collectEls();
  const state = createState();

  let loadSeq = 0;
  let searchTimer = 0;

  const ctx = {
    state,
    els,
    ui: {},
    metrics: () => ({ upem: state.upem, ascent: state.ascent, descent: state.descent }),
    prefix: () => sanitizePrefix(state.prefix),
    fileBase: () => fileBase(state.family),
  };

  /* ---------------------------------------------------------------- helpers */
  const setBusy = (busy) => {
    state.busy = busy;
    document.body.classList.toggle('is-busy', busy);
    els.busyBar.hidden = !busy;
    els.openBtn.disabled = busy;
    els.welcomeOpen.disabled = busy;
    els.grid.setAttribute('aria-busy', String(busy));
  };

  const setControlsEnabled = (enabled) => {
    els.searchInput.disabled = !enabled;
    els.sizeRange.disabled = !enabled;
    els.cssBtn.disabled = !enabled;
    document.querySelectorAll('[data-sort]').forEach((button) => {
      button.disabled = !enabled;
    });
  };

  const showError = (message) => {
    els.errorMsg.textContent = message;
    els.errorBox.hidden = false;
    els.errorBox.scrollIntoView({ block: 'nearest' });
  };

  const hideError = () => {
    els.errorBox.hidden = true;
    els.errorMsg.textContent = '';
  };

  const closeDialogs = () => {
    if (els.drawer.open) els.drawer.close();
    if (els.cssDialog.open) els.cssDialog.close();
    syncScrollLock();
  };

  const syncScrollLock = () => {
    document.documentElement.classList.toggle('locked', els.drawer.open || els.cssDialog.open);
  };

  const renderFontMeta = () => {
    els.fontName.textContent = state.family;
    const bits = [state.subfamily, state.format, state.version ? 'v' + state.version : ''].filter(Boolean);
    els.fontSub.textContent = bits.join(' · ');
    els.statGlyphs.textContent = formatNumber(state.glyphs.length);
    els.statUpem.textContent = String(state.upem);
    els.statMetrics.textContent = formatMetric(state.ascent) + ' / ' + formatMetric(state.descent);
    els.statFormat.textContent = state.format || '—';
    els.fontFile.textContent = state.source ? 'File: ' + state.source : '';
    els.fontFile.hidden = !state.source;
  };

  const renderNoFont = () => {
    state.glyphs = [];
    state.filtered = [];
    state.family = '';
    state.subfamily = '';
    state.version = '';
    state.format = '';
    state.query = '';
    state.prefix = 'icon';
    state.selected = -1;
    state.source = '';

    els.fontName.textContent = STRINGS.noFont.title;
    els.fontSub.textContent = STRINGS.noFont.sub;
    els.fontName.removeAttribute('title');
    els.fontFile.textContent = '';
    els.fontFile.hidden = true;
    els.statGlyphs.textContent = '—';
    els.statUpem.textContent = '—';
    els.statMetrics.textContent = '—';
    els.statFormat.textContent = '—';
    els.resultCount.textContent = '';
    els.resultCount.hidden = true;
    els.searchInput.value = '';
    els.clearSearch.hidden = true;
    els.limitNote.hidden = true;
    els.empty.hidden = true;
    els.grid.replaceChildren();
    els.grid.hidden = true;
    els.grid.setAttribute('aria-busy', 'false');
    els.welcome.hidden = false;
    setControlsEnabled(false);
    document.title = STRINGS.documentTitle;
  };

  const applySize = () => {
    els.grid.style.setProperty('--gsize', state.size + 'px');
    els.sizeOut.textContent = state.size + ' px';
    els.sizeRange.value = String(state.size);
  };

  const setSort = (sort, rerender) => {
    state.sort = sort;
    document.querySelectorAll('[data-sort]').forEach((button) => {
      const active = button.dataset.sort === sort;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (rerender !== false) ctx.ui.grid.render();
  };

  const clearSearch = (focus) => {
    if (!state.glyphs.length) return;
    clearTimeout(searchTimer);
    state.query = '';
    els.searchInput.value = '';
    els.clearSearch.hidden = true;
    ctx.ui.grid.render();
    if (focus) els.searchInput.focus();
  };

  const applyFont = (set, filename) => {
    prepareGlyphs(set.glyphs);
    state.glyphs = set.glyphs;
    state.filtered = set.glyphs.slice();
    state.family = cleanText(set.meta.family) || baseName(filename) || STRINGS.untitledFont;
    state.subfamily = cleanText(set.meta.subfamily);
    state.version = cleanVersion(set.meta.version);
    state.format = cleanText(set.meta.format).toUpperCase() || extOf(filename) || '—';
    state.upem = Number(set.meta.upem) || 1000;
    const [ascent, descent] = normalizeMetrics(set.meta.ascent, set.meta.descent, state.upem);
    state.ascent = ascent;
    state.descent = descent;
    state.source = filename || '';
    state.query = '';
    state.sort = 'file';
    state.selected = -1;
    state.prefix = 'icon';

    clearTimeout(searchTimer);
    hideError();
    closeDialogs();
    renderFontMeta();
    els.searchInput.value = '';
    els.clearSearch.hidden = true;
    els.grid.hidden = false;
    els.welcome.hidden = true;
    els.resultCount.hidden = false;
    setControlsEnabled(true);
    setSort('file', false);
    applySize();
    ctx.ui.grid.render();
    document.title = STRINGS.titleFor(state.family);
    els.fontName.title = state.source ? 'File: ' + state.source : '';
  };

  /* ---------------------------------------------------------------- loading */
  const loadFile = async (file) => {
    if (!file) return;
    if (state.busy) {
      ctx.ui.toast.show(STRINGS.toast.busy, true);
      return;
    }

    const sequence = ++loadSeq;
    setBusy(true);
    hideError();

    try {
      await tick();
      const set = await parseFontFile(file);
      if (sequence !== loadSeq) return;
      applyFont(set, file.name);
      ctx.ui.toast.show(STRINGS.toast.loaded(state.family, formatNumber(state.glyphs.length)));
    } catch (error) {
      if (sequence !== loadSeq) return;
      if (!error || !error.userFacing) console.error(error);
      showError((error && error.message) || STRINGS.parser.unexpected);
      ctx.ui.toast.show(STRINGS.toast.readFailed, true);
    } finally {
      if (sequence === loadSeq) setBusy(false);
    }
  };

  const copy = async (text, successKey) => {
    const copied = await copyText(text);
    ctx.ui.toast.show(copied ? STRINGS.toast[successKey] : STRINGS.toast.copyFailed, !copied);
  };

  /* ---------------------------------------------------------------- wiring */
  ctx.loadFile = loadFile;
  ctx.clearSearch = clearSearch;
  ctx.setSort = setSort;
  ctx.applySize = applySize;
  ctx.showError = showError;
  ctx.hideError = hideError;
  ctx.syncScrollLock = syncScrollLock;

  ctx.ui.toast = createToast(els.toast);
  ctx.ui.grid = createGrid(ctx);
  ctx.ui.drawer = createDrawer(ctx);
  ctx.ui.cssDialog = createCssDialog(ctx);

  createThemeToggle(els.themeBtn, els.themeLabel);
  bindDropzone(ctx);

  const closeOnBackdrop = (dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const outside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;
      if (outside) dialog.close();
    });
  };

  const openPicker = () => els.fileInput.click();

  els.openBtn.addEventListener('click', openPicker);
  els.welcomeOpen.addEventListener('click', openPicker);
  els.fileInput.addEventListener('change', () => {
    const file = els.fileInput.files && els.fileInput.files[0];
    els.fileInput.value = '';
    if (file) loadFile(file);
  });

  els.searchInput.addEventListener('input', () => {
    state.query = els.searchInput.value;
    els.clearSearch.hidden = !state.query;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => ctx.ui.grid.render(), 80);
  });
  els.searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && els.searchInput.value) {
      event.preventDefault();
      clearSearch(true);
    }
  });
  els.clearSearch.addEventListener('click', () => clearSearch(true));
  els.emptyClear.addEventListener('click', () => clearSearch(true));
  els.closeError.addEventListener('click', hideError);

  document.querySelectorAll('[data-sort]').forEach((button) => {
    button.addEventListener('click', () => setSort(button.dataset.sort));
  });

  els.sizeRange.addEventListener('input', () => {
    const value = parseInt(els.sizeRange.value, 10);
    if (Number.isFinite(value)) {
      state.size = value;
      applySize();
    }
  });

  els.grid.addEventListener('click', (event) => {
    const card = event.target.closest('.glyph-card');
    if (card) ctx.ui.drawer.open(Number(card.dataset.id));
  });

  els.cssBtn.addEventListener('click', () => ctx.ui.cssDialog.open());
  els.closeCss.addEventListener('click', () => els.cssDialog.close());
  els.closeDrawer.addEventListener('click', () => els.drawer.close());
  els.prevBtn.addEventListener('click', () => ctx.ui.drawer.step(-1));
  els.nextBtn.addEventListener('click', () => ctx.ui.drawer.step(1));

  els.copyRule.addEventListener('click', () => {
    const glyph = state.glyphs[state.selected];
    if (glyph) copy(ruleFor(glyph, ctx.prefix()), 'cssCopied');
  });
  els.copyChar.addEventListener('click', () => {
    const glyph = state.glyphs[state.selected];
    if (glyph) copy(String.fromCodePoint(...glyph.cps), 'charCopied');
  });
  els.downloadSvg.addEventListener('click', () => ctx.ui.drawer.downloadSvg());

  els.prefixInput.addEventListener('input', () => {
    state.prefix = els.prefixInput.value;
    ctx.ui.cssDialog.update();
  });
  els.prefixInput.addEventListener('blur', () => {
    state.prefix = sanitizePrefix(els.prefixInput.value);
    els.prefixInput.value = state.prefix;
    ctx.ui.cssDialog.update();
  });
  els.copyCss.addEventListener('click', () => copy(ctx.ui.cssDialog.css(), 'cssCopied'));
  els.downloadCss.addEventListener('click', () => ctx.ui.cssDialog.downloadCss());
  els.downloadCsv.addEventListener('click', () => ctx.ui.cssDialog.downloadCsv());

  els.drawer.addEventListener('close', () => {
    state.selected = -1;
    syncScrollLock();
  });
  els.cssDialog.addEventListener('close', syncScrollLock);
  els.drawer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      ctx.ui.drawer.step(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      ctx.ui.drawer.step(1);
    }
  });
  closeOnBackdrop(els.drawer);
  closeOnBackdrop(els.cssDialog);

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const tag = target && target.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (target && target.isContentEditable);
    if (event.key === '/' && !typing && !els.searchInput.disabled && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      els.searchInput.focus();
    }
  });

  /* ---------------------------------------------------------------- boot */
  applySize();
  renderNoFont();
};
