/**
 * Every user-visible string in the app. English only, but kept in one place so
 * copy changes never require touching the UI code.
 */

export const STRINGS = {
  brand: 'Glyphary',
  brandTag: 'icon font reader',
  documentTitle: 'Glyphary — icon font viewer',
  titleFor: (family) => family + ' — Glyphary',

  skip: 'Skip to glyphs',
  localOnly: '100% local',

  openFont: 'Open font',
  openFontTitle: 'Accepts .svg, .woff, .woff2, .ttf and .otf',
  untitledFont: 'Untitled font',
  noFont: {
    title: 'No font loaded',
    sub: 'Waiting for a font file.',
  },
  welcome: {
    eyebrow: 'Start here',
    title: 'Open a font to begin.',
    lead: 'Glyphary reads icon fonts entirely on your device, then turns every glyph into a specimen with its code point, class name and CSS rule.',
    action: 'Open font',
    privacy: 'Nothing is uploaded. Your font file never leaves this device.',
    artLabel: 'Drop a font anywhere',
    artFoot: 'svg · woff · woff2 · ttf · otf',
  },

  theme: {
    label: 'Theme',
    auto: 'Auto',
    light: 'Light',
    dark: 'Dark',
    title: (mode) => 'Theme: ' + mode,
    hint: 'Auto, light and dark',
  },

  eyebrow: 'Displayed font',
  stats: {
    glyphs: 'Glyphs',
    upm: 'UPM',
    upmTitle: 'Units per em',
    metrics: 'Asc / desc',
    metricsTitle: 'Ascent / descent',
    format: 'Format',
    metricsLabel: 'Font metrics',
  },
  dropHint: {
    before: 'Drag a',
    after: 'file or use',
  },

  search: {
    placeholder: 'Search name, code or U+E900…',
    label: 'Search glyphs',
    clear: 'Clear search',
    sortGroup: 'Sort glyphs',
    sortFile: 'File',
    sortName: 'Name',
    sortCode: 'Code',
    size: 'Size',
    sizeLabel: 'Glyph size in pixels',
    css: 'CSS',
  },
  results: {
    empty: '—',
    glyphs: (count) => count + (count === 1 ? ' glyph' : ' glyphs'),
    filtered: (shown, total) => shown + ' of ' + total,
  },
  empty: {
    title: 'Nothing here.',
    body: (query) => 'No glyph matches “' + query + '”.',
    clear: 'Clear search',
  },
  limit: (shown, total) =>
    'Showing the first ' + shown + ' of ' + total + ' glyphs. Refine your search to see the rest.',

  error: {
    title: 'Could not read the font',
    dismiss: 'Dismiss notice',
  },

  drawer: {
    index: (position, total) => 'GLYPH ' + position + ' / ' + total,
    preview: 'Preview',
    cssLabel: 'CSS',
    copy: 'Copy',
    unicode: 'Unicode',
    decimal: 'Decimal',
    advance: 'Advance',
    glyphId: 'Glyph ID',
    indexLabel: 'Index',
    copyChar: 'Copy character',
    downloadSvg: 'Download SVG',
    previous: 'Previous glyph',
    previousTitle: 'Previous glyph (←)',
    next: 'Next glyph',
    nextTitle: 'Next glyph (→)',
    close: 'Close details',
  },

  cssDialog: {
    title: 'Export CSS',
    meta: (rules, prefix) => rules + (rules === 1 ? ' rule' : ' rules') + ' · prefix .' + prefix,
    classPrefix: 'Class prefix',
    hintBefore: 'Rules use the code points of the loaded file. Include the original',
    hintAfter: 'in your project.',
    downloadCsv: 'Download CSV',
    downloadCss: 'Download .css',
    copyCss: 'Copy CSS',
    close: 'Close export',
  },

  dropOverlay: {
    title: 'Drop the font here',
    sub: '.svg · .woff · .woff2 · .ttf · .otf',
  },

  footer: {
    local: 'Glyphary · local processing. No file leaves your browser.',
    shortcuts: '/ search · ← → navigate · esc close',
    creditBefore: 'Parsing by',
    creditAfter: '· MIT',
  },

  toast: {
    charCopied: 'Character copied',
    cssCopied: 'CSS copied',
    copyFailed: 'Could not copy',
    loaded: (family, count) => family + ' · ' + count + ' glyphs',
    readFailed: 'Could not read the font',
    saveFailed: 'Could not save the file',
    busy: 'Wait for the current read to finish.',
  },

  parser: {
    notRecognized: 'Unrecognized format. Send an SVG font, WOFF, WOFF2, TTF or OTF.',
    unreadable: 'Could not parse the font. The file may be corrupt or use an unsupported format.',
    noVisibleGlyphs: 'No visible glyph was found in this font.',
    svgMalformed: 'The SVG could not be parsed. Check that the XML is well formed.',
    svgNoFont: 'No <font> element found. Send an SVG font (IcoMoon/FontForge), not a regular icon SVG.',
    svgNoGlyphs: 'The SVG font has no glyphs with unicode and path.',
    fileTooLarge: 'File too large. The limit is 30 MB.',
    unexpected: 'Unexpected error while reading the file.',
  },
};
