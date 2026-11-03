// Drawing helpers shared by the profile's SVGs: text metrics, line breaking, small icons.
import * as fontkit from "fontkit";
import { esc, fontFaces, fontFile, type FaceName } from "../shared/theme";

const fonts = new Map<FaceName, any>();
function font(face: FaceName) {
  if (!fonts.has(face)) fonts.set(face, fontkit.openSync(fontFile(face)));
  return fonts.get(face);
}

// Width of a line of text as the browser lays it out with the embedded font.
function measure(text: string, face: FaceName, size: number): number {
  const f = font(face);
  return (f.layout(text).advanceWidth * size) / f.unitsPerEm;
}

// Breaks text into lines that fit `width`.
function wrap(text: string, face: FaceName, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, face, size) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export const f2 = (n: number) => Number(n.toFixed(2)).toString();

// Text broken to fit `width`, as <text> lines `lead` apart, the first with its baseline on y.
// Returns the elements and the last line's baseline.
export function lines(text: string, face: FaceName, size: number, width: number, x: number, y: number, lead: number, attrs: string) {
  const rows = wrap(text, face, size, width);
  const svg = rows.map((row, i) => `<text x="${f2(x)}" y="${f2(y + i * lead)}" ${attrs}>${esc(row)}</text>`).join("");
  return { svg, last: y + (rows.length - 1) * lead };
}

export const arrow = (x: number, y: number, c: string) =>
  `<path d="M${x + 1} ${y + 4}l7.5-7.5M${x + 3} ${y - 3.5}h5.5v5.5" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

export const play = (x: number, y: number, c: string) =>
  `<path d="M${x} ${y - 5}v10a.75.75 0 0 0 1.15.63l7.8-5a.75.75 0 0 0 0-1.26l-7.8-5a.75.75 0 0 0-1.15.63z" fill="${c}"/>`;

// A page with a folded corner, for papers.
export const paper = (x: number, y: number, c: string) =>
  `<path d="M${x + 0.8} ${y - 5.5}h5l3.2 3.2v7.8a.8.8 0 0 1-.8.8H${x + 0.8}a.8.8 0 0 1-.8-.8v-10.2a.8.8 0 0 1 .8-.8zM${x + 5.8} ${y - 5.5}v3.2h3.2M${x + 2.4} ${y + 1}h4.4M${x + 2.4} ${y + 3.4}h3" stroke="${c}" stroke-width="1.3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;

export function svgDoc(w: number, h: number, title: string, faces: FaceName[], css: string, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}">` +
    `<title>${esc(title)}</title>` +
    `<style>${fontFaces(faces)}${css}</style>` +
    body +
    `</svg>`
  );
}
