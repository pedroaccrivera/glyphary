/** Small DOM helpers shared by the UI layer. */

export const SVG_NS = 'http://www.w3.org/2000/svg';

export const $ = (id) => document.getElementById(id);

export const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

export const svgEl = (tag) => document.createElementNS(SVG_NS, tag);

/** Waits for the next paint so busy states are visible before heavy work. */
export const tick = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
