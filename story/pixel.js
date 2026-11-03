// The film's pixel layer: a 320x136 canvas and the drawing moves every scene shares. Nothing
// here keeps state between frames, so any moment of the film can be drawn on its own.

export const W = 320;
export const H = 136;

export const canvas = (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h });
export const art = canvas(W, H);
export const g = art.getContext("2d");

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
// 0 until t reaches a, 1 from b on, a straight ramp between.
export const span = (t, a, b) => clamp((t - a) / (b - a));
// 1 between a and b, ramping up and down over `edge` seconds at either end.
export const during = (t, a, b, edge = 0.35) => Math.min(span(t, a, a + edge), 1 - span(t, b - edge, b));

export function rect(x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
export const px = (x, y, c) => rect(x, y, 1, 1, c);

export function line(x0, y0, x1, y1, c) {
  [x0, y0, x1, y1] = [x0, y0, x1, y1].map(Math.round);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  g.fillStyle = c;
  for (;;) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

// A filled circle with hard pixel edges.
export function disc(cx, cy, r, c) {
  const R = Math.round(r);
  g.fillStyle = c;
  for (let y = -R; y <= R; y++) {
    const half = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
    g.fillRect(Math.round(cx) - half, Math.round(cy) + y, half * 2 + 1, 1);
  }
}

// n dots around a circle: wheels, sparkles.
export function ring(cx, cy, r, c, n = 8) {
  for (let a = 0; a < n; a++) {
    const ang = (a / n) * Math.PI * 2;
    px(cx + Math.round(Math.cos(ang) * r), cy + Math.round(Math.sin(ang) * r), c);
  }
}

// Deterministic noise: the same arguments give the same number on every render.
export function hash(a, b = 0, c = 0) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x9e3779b9, 0x165667b1) ^ Math.imul((c | 0) + 0x7f4a7c15, 0x1b873593);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Smooth value noise in 0..1, for coastlines, clouds and hills.
export function noise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const sx = ease(x - xi);
  const sy = ease(y - yi);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}

// Ordered dithering, the film's only way of blending two colours. A pixel at x, y takes the
// colour when bayer(x, y) < amount; each colour and level is a 4x4 pattern tile, cached.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

const tiles = new Map();
function tile(c, level) {
  const key = `${c}/${level}`;
  if (!tiles.has(key)) {
    const t = canvas(4, 4).getContext("2d");
    t.fillStyle = c;
    BAYER.forEach((v, i) => v < level && t.fillRect(i % 4, i >> 2, 1, 1));
    tiles.set(key, g.createPattern(t.canvas, "repeat"));
  }
  return tiles.get(key);
}

export function dither(x, y, w, h, c, amount) {
  const level = clamp(Math.ceil(amount * 16 - 0.5), 0, 16);
  if (level > 0) rect(x, y, w, h, level === 16 ? c : tile(c, level));
}

export const fade = (amount) => dither(0, 0, W, H, "#05060b", amount);

// Vertical gradient through `colors` from y0 to y1, in four dithered steps between each pair.
export function gradient(y0, y1, colors, x0 = 0, x1 = W) {
  const n = colors.length - 1;
  for (let y = Math.round(y0); y < Math.round(y1); y++) {
    const p = (n * (y - y0)) / (y1 - y0);
    const i = Math.min(n - 1, Math.floor(p));
    rect(x0, y, x1 - x0, 1, colors[i]);
    dither(x0, y, x1 - x0, 1, colors[i + 1], Math.round((p - i) * 4) / 4);
  }
}

// A soft pool of light: a few faint discs, brightest in the middle.
export function glow(x, y, r, c, strength) {
  g.globalAlpha = strength * 0.25;
  for (let i = 3; i >= 1; i--) disc(x, y, (r * i) / 3, c);
  g.globalAlpha = 1;
}

// Everything outside the circle goes dark: the iris that closes on someone and opens again.
export function iris(cx, cy, r) {
  g.fillStyle = "#05060b";
  for (let y = 0; y < H; y++) {
    const d = r * r - (y + 0.5 - cy) ** 2;
    if (d <= 0) {
      g.fillRect(0, y, W, 1);
      continue;
    }
    const half = Math.sqrt(d);
    const a = Math.round(cx - half);
    const b = Math.round(cx + half);
    if (a > 0) g.fillRect(0, y, a, 1);
    if (b < W) g.fillRect(b, y, W - b, 1);
  }
}

// Pixel art from strings: one character per pixel, "." is empty. flip mirrors it.
export function sprite(rows, palette, x, y, flip = false) {
  const w = rows[0].length;
  rows.forEach((row, j) => {
    for (let i = 0; i < w; i++) {
      const c = palette[row[flip ? w - 1 - i : i]];
      if (c) px(x + i, y + j, c);
    }
  });
}

// A 3x5 pixel font for signs, screens and speech bubbles: five rows of three bits per glyph.
const GLYPHS = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111",
  F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010",
  K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010",
  P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010",
  Z: "111001010100111", 0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110",
  4: "101101111001001", 5: "111100110001110", 6: "011100111101111", 7: "111001010010010", 8: "111101111101111",
  9: "111101111001110", ".": "000000000000010", ",": "000000000010100", "-": "000000111000000", ":": "000010000010000",
  "/": "001001010100100", "!": "010010010000010", "?": "110001010000010", "+": "000010111010000", "%": "101001010100101",
  "'": "010010000000000", "<": "001010100010001", ">": "100010001010100", "=": "000111000111000", "#": "101111101111101",
  "(": "010100100100010", ")": "010001001001010", "*": "000101010101000", "_": "000000000000111", " ": "000000000000000",
};

export const textWidth = (str, scale = 1) => str.length * 4 * scale - scale;

// x is the left edge, or the middle when centre is set.
export function text(str, x, y, c, scale = 1, centre = false) {
  let cx = Math.round(centre ? x - textWidth(str, scale) / 2 : x);
  for (const ch of str.toUpperCase()) {
    const bits = GLYPHS[ch] ?? GLYPHS[" "];
    for (let i = 0; i < 15; i++) if (bits[i] === "1") rect(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale, c);
    cx += 4 * scale;
  }
}
