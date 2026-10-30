/** Entry point for turning an uploaded File into a glyph set. */

import { STRINGS } from '../strings.js';
import { extOf } from '../text.js';
import { parseBinaryFont } from './binary-font.js';
import { inputError } from './shared.js';
import { parseSvgFont } from './svg-font.js';

export { parseBinaryFont, parseSvgFont };
export const MAX_FILE_BYTES = 30 * 1024 * 1024;

const looksLikeSvg = (head) => /<svg[\s>]|<font[\s>]|<!doctype svg/i.test(head);

export const parseFontFile = async (file) => {
  if (file.size > MAX_FILE_BYTES) throw inputError(STRINGS.parser.fileTooLarge);

  if (extOf(file.name) === 'SVG') return parseSvgFont(await file.text(), file.name);

  const buffer = await file.arrayBuffer();
  const head = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 512));
  if (looksLikeSvg(head)) {
    return parseSvgFont(new TextDecoder('utf-8', { fatal: false }).decode(buffer), file.name);
  }
  return parseBinaryFont(new Uint8Array(buffer), file.name);
};
