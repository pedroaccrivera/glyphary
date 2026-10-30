/** Helpers shared by the SVG and binary font parsers. */

import { STRINGS } from '../strings.js';

/** Errors marked `userFacing` are shown in the UI without a console trace. */
export const inputError = (message) => {
  const error = new Error(message);
  error.userFacing = true;
  return error;
};

/** Spaces, controls, format characters and the two non-characters. */
export const isBlankCodePoint = (cp) => {
  if (!Number.isInteger(cp) || cp < 0 || cp === 0xffff || cp === 0xfffe) return true;
  let character;
  try {
    character = String.fromCodePoint(cp);
  } catch (error) {
    return true;
  }
  return /[\s\p{Cc}\p{Cf}]/u.test(character);
};

/**
 * Container/flavour detection from the sfnt magic plus the table directory.
 * fontkit reports `TTF` for CFF-flavoured OTTO files, so inspect the tables.
 */
export const formatFromBytes = (bytes, font) => {
  const magic = String.fromCharCode(bytes[0] || 0, bytes[1] || 0, bytes[2] || 0, bytes[3] || 0);
  if (magic === 'wOFF') return 'WOFF';
  if (magic === 'wOF2') return 'WOFF2';
  if (magic === 'OTTO') return 'OTF';
  const tables = font && font.directory && font.directory.tables;
  if (tables && ('CFF ' in tables || 'CFF2' in tables)) return 'OTF';
  return 'TTF';
};

export const isKnownFontMagic = (bytes) => {
  const magic = String.fromCharCode(bytes[0] || 0, bytes[1] || 0, bytes[2] || 0, bytes[3] || 0);
  return (
    magic === 'wOFF' ||
    magic === 'wOF2' ||
    magic === 'OTTO' ||
    magic === 'true' ||
    magic === 'typ1' ||
    (bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0)
  );
};

export const parserMessages = STRINGS.parser;
