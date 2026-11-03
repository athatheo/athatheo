// The film's scenes, in order. Each draws itself at a local time t in seconds and puts Thanos in
// it with hero() or heroOnBike(), which tell the transitions where he is. A scene he walks out
// of keeps him walking past its end, and one he walks into starts him off-screen, so the
// transition between them only has to blend the two paths.
import { W, H, g, rect, px, line, disc, ring, hash, noise, dither, gradient, glow, sprite, text, textWidth, lerp, ease, span } from "./pixel.js";
import { person, hero, heroOnBike, bike, PEOPLE, LAB_COAT, INK } from "./cast.js";

// Where someone is along [time, x] stops, and whether they are walking.
function track(t, stops) {
  if (t < stops[0][0]) return { x: stops[0][1], moving: false };
  for (let i = 1; i < stops.length; i++) {
    const [t0, x0] = stops[i - 1];
    const [t1, x1] = stops[i];
    if (t < t1) return { x: lerp(x0, x1, (t - t0) / (t1 - t0)), moving: x0 !== x1 };
  }
  return { x: stops.at(-1)[1], moving: false };
}

const blink = (t, rate, seed = 0) => hash(Math.floor(t * rate), seed) > 0.5;
const pick = (list, i) => list[((i % list.length) + list.length) % list.length];
// Everyone jumping in turn once the party starts.
const hop = (t, from, i) => (t > from && (Math.floor(t * 6) + i) % 2 === 0 ? 2 : 0);

function stars(n, seed, t, x = 0, y = 0, w = W, h = H) {
  for (let i = 0; i < n; i++) {
    const tw = hash(i, Math.floor(t * 3 + hash(i, seed, 2) * 7), seed);
    px(x + Math.floor(hash(i, seed) * w), y + Math.floor(hash(i, seed, 1) * h), tw > 0.85 ? "#ffffff" : hash(i, seed, 3) > 0.6 ? "#c9d4ff" : "#7d87b3");
  }
}

// A skyline of hills or mountains: noise heights standing on `base`, filled down to `bottom`.
// octaves are [scale, height, seed]; peaks taller than `snow` get a white tip.
function ridge(base, bottom, octaves, c, x0 = 0, x1 = W, snow = Infinity) {
  for (let x = x0; x < x1; x++) {
    const h = Math.floor(octaves.reduce((sum, [scale, amp, seed]) => sum + noise((x - x0) / scale, 0, seed) * amp, 0));
    rect(x, base - h, 1, bottom - base + h, c);
    if (h > snow) px(x, base - h, "#cfd6e2");
  }
}

// The back wall with its upright lines, the floor, and the skirting where they meet.
function room(wall, stripe, every, floor, skirt) {
  rect(0, 0, W, 104, wall);
  if (stripe) for (let x = 0; x < W; x += every) rect(x, 0, 1, 104, stripe);
  rect(0, 104, W, H - 104, floor);
  if (skirt) rect(0, 103, W, 2, skirt);
}

// A window: its frame, the view through it, the glazing bars and the sill.
function pane(x, y, w, h, frame, sill, view, cross = false) {
  rect(x - 3, y - 3, w + 6, h + 6, frame);
  view();
  rect(x + w / 2 - 1, y, 2, h, frame);
  if (cross) rect(x, y + h / 2 - 1, w, 2, frame);
  rect(x - 4, y + h, w + 8, 3, sill);
}

// A cone of light from the top of the frame down to `bottom`, dithered.
function beam(x0, x1, bottom, half0, half1, c, a0, a1) {
  for (let y = 0; y < bottom; y++) {
    const k = y / bottom;
    const half = lerp(half0, half1, k);
    dither(lerp(x0, x1, k) - half, y, half * 2, 1, c, lerp(a0, a1, k));
  }
}

function ceilingLamp(x, c = "#ffe7b0") {
  rect(x - 1, 0, 2, 4, "#2a3245");
  rect(x - 4, 4, 8, 2, "#3b4560");
  glow(x, 8, 26, c, 0.35);
}

// A screen in its bezel, on a stand `pole` pixels tall.
function monitor(x, y, w, h, screen = "#0b1220", pole = 2) {
  rect(x - 1, y - 1, w + 2, h + 2, "#1a1d24");
  rect(x, y, w, h, screen);
  rect(x + w / 2 - 1, y + h + 1, 2, pole, "#1a1d24");
  rect(x + w / 2 - 4, y + h + 1 + pole, 8, 1, "#1a1d24");
}

// Lines of code or logs on a screen, changing `rate` times a second.
function codeLines(x, y, rows, width, t, rate, colour, seed = 0, indent = 0) {
  const tick = Math.floor(t * rate);
  for (let r = 0; r < rows; r++) rect(x + (r % 3) * indent, y + r * 2, 2 + Math.floor(hash(r, tick, seed) * width), 1, colour(r, tick));
}
const SCREEN = ["#5ee6a8", "#9be7ff", "#ffc65a", "#c9d4ff"];

function desk(x, y, w, top = "#7a5a43", legs = "#4e3a2c") {
  rect(x, y, w, 2, top);
  rect(x, y + 2, w, 1, legs);
  rect(x + 1, y + 3, 2, 112 - y - 3, legs);
  rect(x + w - 3, y + 3, 2, 112 - y - 3, legs);
}

function chair(x, y, c = "#2c3446") {
  rect(x, y - 9, 2, 9, c);
  rect(x, y - 4, 9, 2, c);
  rect(x + 4, y - 2, 1, 2, c);
}

function laptop(x, y, glowing = "#9be7ff") {
  rect(x, y, 7, 1, "#9aa3b2");
  rect(x + 1, y - 4, 5, 4, "#2a2f3a");
  rect(x + 2, y - 3, 3, 2, glowing);
}

// A speech bubble with a tail, sized to its text.
function bubble(x, y, str, ink = "#1d2330", paper = "#f4f1ec") {
  const w = textWidth(str) + 6;
  rect(x + 1, y, w - 2, 9, paper);
  rect(x, y + 1, w, 7, paper);
  rect(x + 3, y + 9, 2, 1, paper);
  px(x + 3, y + 10, paper);
  text(str, x + 3, y + 2, ink);
}

// The agent robots of the later scenes: a screen for a face and eyes that look around.
function robot(x, y, t, { eyes = "#7ef0c8", look = 0, body = "#d7dce4" } = {}) {
  const shade = "#9aa3b2";
  x = Math.round(x);
  rect(x + 5, y - 17, 1, 2, shade);
  px(x + 5, y - 18, blink(t, 2, 3) ? "#ff5c7a" : "#ffb3c1");
  rect(x + 1, y - 15, 10, 8, body);
  rect(x + 2, y - 14, 8, 6, "#151a24");
  const ex = x + 3 + look;
  const shut = hash(Math.floor(t * 4), 9) > 0.92;
  rect(ex, y - 12 + (shut ? 1 : 0), 2, shut ? 1 : 2, eyes);
  rect(ex + 4, y - 12 + (shut ? 1 : 0), 2, shut ? 1 : 2, eyes);
  rect(x + 2, y - 7, 8, 5, body);
  rect(x + 2, y - 3, 8, 1, shade);
  rect(x + 1, y - 2, 3, 2, "#2a2f3a");
  rect(x + 8, y - 2, 3, 2, "#2a2f3a");
}

// Rows of heads seen from behind, at the bottom of the frame.
function crowd(y, n, seed, t, { raise = 0, phones = 0 } = {}) {
  const c = "#0b0816";
  for (let i = 0; i < n; i++) {
    const x = Math.floor((i + hash(i, seed) * 0.6) * (W / n)) - 4;
    const yy = y + Math.floor(hash(i, seed, 1) * 6);
    const bob = raise > 0 ? Math.round(Math.sin(t * 9 + i * 1.7)) : 0;
    disc(x + 5, yy + bob, 4, c);
    rect(x, yy + 4 + bob, 11, H - yy, c);
    if (raise > 0 && hash(i, seed, 2) < raise) {
      const up = Math.sin(t * 10 + i) > 0 ? 1 : 0;
      rect(x + (i % 2 ? 10 : 0), yy - 6 - up + bob, 1, 7, c);
    }
    if (phones > 0 && hash(i, seed, 3) < phones) {
      const on = hash(i, Math.floor(t * 1.5), seed) > 0.25;
      rect(x + 7, yy - 3 + bob, 3, 4, on ? "#9fe3ff" : "#3a6b85");
      if (on) glow(x + 8, yy - 1 + bob, 5, "#9fe3ff", 0.25);
    }
  }
}

function confetti(t, n, seed) {
  const colors = ["#ff5c7a", "#ffd166", "#06d6a0", "#4cc9f0", "#c77dff", "#ffffff"];
  for (let i = 0; i < n; i++) {
    const age = t - hash(i, seed) * 1.2;
    if (age < 0) continue;
    const x = hash(i, seed, 1) * W + Math.sin(age * 4 + i) * 4;
    const y = -4 + age * (30 + hash(i, seed, 2) * 24);
    if (y > H) continue;
    rect(x, y, hash(i, seed, 3) > 0.5 ? 2 : 1, 1 + (Math.floor(age * 8 + i) % 2), colors[i % colors.length]);
  }
}

// A dark panel for the scenes' read-outs.
function panel(x, y, w, h, edge = "#3d444d") {
  g.globalAlpha = 0.86;
  rect(x, y, w, h, "#0b0f16");
  g.globalAlpha = 1;
  rect(x, y, w, 1, edge);
  rect(x, y + h - 1, w, 1, edge);
  rect(x, y, 1, h, edge);
  rect(x + w - 1, y, 1, h, edge);
}

// ── Thessaloniki: the iGEM team's dry lab, late. ─────────────────────────────────────────────

export function lab(t) {
  room("#1b2333", "#1f2839", 16, "#222a3a", "#2f3a52");
  for (let y = 8; y < 104; y += 16) rect(0, y, W, 1, "#1f2839");
  for (const y of [109, 116, 126]) rect(0, y, W, 1, "#283143");

  // The window over the bay: hills across the water, the moon, lights along the shore.
  const wx = 196;
  const wy = 10;
  pane(wx, wy, 96, 52, "#3a4458", "#4a5672", () => {
    gradient(wy, wy + 40, ["#0a1028", "#15204a", "#2a3a72"], wx, wx + 96);
    stars(26, 4, t, wx, wy, 96, 30);
    disc(wx + 76, wy + 10, 4, "#f6f1d5");
    glow(wx + 76, wy + 10, 14, "#f6f1d5", 0.4);
    ridge(wy + 32, wy + 40, [[14, 8, 7]], "#11193a", wx, wx + 96);
    rect(wx, wy + 40, 96, 12, "#0e1a3a");
    for (let i = 0; i < 18; i++) px(wx + 4 + i * 5 + (i % 3), wy + 39, blink(t, 1, i + 40) ? "#ffd27a" : "#c99a4a");
    for (let j = 0; j < 5; j++) {
      const w = 10 - j * 2 + (Math.floor(t * 4 + j) % 3);
      rect(wx + 76 - w / 2 + Math.sin(t * 2 + j) * 2, wy + 42 + j * 2, w, 1, "#f6f1d5");
    }
  }, true);

  ceilingLamp(64);
  ceilingLamp(150);

  // The team's poster and the clock that says it is late.
  rect(132, 34, 40, 50, "#e9e4d8");
  rect(134, 36, 36, 9, "#1f8a5b");
  text("IGEM", 144, 38, "#e9e4d8");
  for (let y = 0; y < 32; y++) {
    const s = Math.sin(y * 0.45);
    px(152 + Math.round(s * 7), 48 + y, "#d94a6a");
    px(152 - Math.round(s * 7), 48 + y, "#3a6fd9");
    if (y % 4 === 0) rect(152 - Math.abs(Math.round(s * 7)) + 1, 48 + y, Math.abs(Math.round(s * 14)) - 1, 1, "#b8b1a2");
  }
  disc(152, 21, 6, "#d9dde3");
  disc(152, 21, 5, "#f4f6f8");
  line(152, 21, 152, 17, "#1d2330");
  line(152, 21, 155, 22, "#1d2330");

  // The wet bench: tubes, a microscope and the thermal cycler.
  rect(8, 40, 108, 16, "#26314a");
  for (let x = 8; x < 116; x += 27) rect(x, 40, 1, 16, "#1b2333");
  rect(8, 56, 108, 1, "#1b2333");
  const tubes = ["#ff6b8b", "#5ee6a8", "#5aa9ff", "#ffc65a", "#b57cff"];
  rect(14, 100, 20, 2, "#8a94a3");
  tubes.forEach((c, i) => {
    rect(15 + i * 4, 94, 2, 6, "#b9d3e3");
    rect(15 + i * 4, 97 - (i % 2), 2, 3 + (i % 2), c);
  });
  rect(42, 100, 9, 2, "#c9ced6");
  rect(47, 92, 2, 8, "#c9ced6");
  rect(43, 91, 6, 2, "#9aa3b2");
  rect(44, 96, 4, 1, "#9aa3b2");
  rect(94, 93, 20, 9, "#c9ced6");
  rect(96, 95, 12, 5, "#0e1a12");
  text("95C", 97, 95, "#5ee6a8");
  px(111, 96, blink(t, 2) ? "#ff5c7a" : "#5b2230");
  rect(8, 102, 112, 2, "#d3d9e1");
  rect(8, 104, 112, 8, "#5d687d");
  for (let x = 8; x < 120; x += 28) {
    rect(x, 104, 1, 8, "#4a5468");
    rect(x + 12, 107, 4, 1, "#aab3c2");
  }

  // Two of the team at the bench.
  person({ ...PEOPLE[3], ...LAB_COAT }, 52, 112, Math.floor(t * 2) % 2 ? "type" : "hold", t);
  person({ ...PEOPLE[1], ...LAB_COAT }, 84, 112, "stand", t, true);

  // The dry lab: an expression heatmap and a turning double helix.
  desk(206, 102, 92);
  monitor(232, 84, 28, 15);
  for (let c = 0; c < 6; c++)
    for (let r = 0; r < 3; r++) {
      const v = noise(c * 0.9, r * 1.3 + t * 0.6, 3);
      rect(234 + c * 4, 86 + r * 4, 4, 4, v > 0.62 ? "#ff5c6a" : v > 0.5 ? "#b8435a" : v > 0.38 ? "#4767b8" : "#2b4a9a");
    }
  monitor(266, 84, 28, 15);
  for (let x = 0; x < 26; x++) {
    const a = x * 0.55 + t * 4;
    const s = Math.sin(a);
    const front = Math.cos(a) > 0;
    const y0 = 91 + Math.round(s * 4);
    const y1 = 91 - Math.round(s * 4);
    if (x % 3 === 0 && Math.abs(s) > 0.3) line(267 + x, Math.min(y0, y1) + 1, 267 + x, Math.max(y0, y1) - 1, pick(["#ff6b8b", "#5ee6a8", "#ffc65a", "#5aa9ff"], x / 3));
    px(267 + x, y0, front ? "#9be7ff" : "#3a7ca5");
    px(267 + x, y1, front ? "#3a7ca5" : "#9be7ff");
  }

  chair(212, 112);
  const me = track(t, [[3.1, 214], [5.6, 290], [6.8, 326]]);
  hero(me.x, 112, me.moving ? "walk" : "type", t);
}

// ── The iGEM Giant Jamboree: a gold medal for the team. ──────────────────────────────────────

export function jamboree(t) {
  gradient(0, 112, ["#0d0a1f", "#17113a", "#241a52"]);
  for (let i = 0; i < 3; i++) {
    const sx = 146 + i * 82;
    beam(sx, sx + Math.sin(t * 1.3 + i * 2) * 40, 112, 2, 20, "#fff1c9", 0.2, 0.12);
  }
  // The big screen, where the medal comes up.
  const cx = 220;
  const won = 2.6;
  rect(cx - 82, 10, 164, 52, "#2a2160");
  rect(cx - 80, 12, 160, 48, "#140f33");
  text("IGEM 2017", cx, 16, "#ffd166", 2, true);
  text("GIANT JAMBOREE", cx, 30, "#c9c3ff", 1, true);
  if (t > won) {
    glow(cx - 30, 47, 18, "#ffd166", 0.4);
    disc(cx - 30, 47, 6, "#c98a12");
    disc(cx - 30, 47, 5, "#ffd166");
    rect(cx - 32, 47, 5, 1, "#c98a12");
    rect(cx - 30, 45, 1, 5, "#c98a12");
    const glint = Math.floor(t * 6) % 6;
    if (glint < 3) px(cx - 33 + glint * 2, 44, "#ffffff");
    text("GOLD MEDAL", cx + 8, 45, blink(t, 4) ? "#ffd166" : "#fff3c4", 1, true);
    dither(cx - 80, 12, 160, 48, "#fff3c4", 0.8 * (1 - span(t, won, won + 0.4)));
  }
  rect(0, 98, W, 14, "#4a3560");
  rect(0, 98, W, 1, "#7b5c96");
  for (let x = 0; x < W; x += 20) rect(x, 99, 1, 13, "#3f2d52");
  rect(0, 112, W, 6, "#2a1d38");
  rect(0, 112, W, 1, "#5c4473");

  // The team lines up, Thanos walks on to join them, and everyone jumps.
  const party = won + 0.2;
  [1, 3, 0, 5, 2, 4].forEach((p, i) => person(PEOPLE[p], 92 + i * 16, 112 - hop(t, party, i), t > party ? "cheer" : "stand", t, i > 2));
  const me = track(t, [[0, -28], [2.6, 76]]);
  hero(me.x, 112, me.moving ? "walk" : t > party ? "cheer" : "stand", t, false, me.moving ? 0 : hop(t, party, 7));
  if (t > party) confetti(t - party, 140, 11);
  rect(0, 118, W, H - 118, "#140e26");
  crowd(118, 22, 5, t, { raise: t > party ? 0.5 : 0 });
}

// ── AcubeSAT: the flight software team and its CubeSat. ──────────────────────────────────────

function cubesat(x, y, deploy, t) {
  x = Math.round(x);
  y = Math.round(y);
  const wing = Math.round(deploy * 14);
  if (wing > 0) {
    for (const side of [-1, 1]) {
      const wx = side < 0 ? x - wing - 1 : x + 11;
      rect(wx, y + 3, wing, 27, "#1d3b7a");
      for (let j = 0; j < 27; j += 4) rect(wx, y + 3 + j, wing, 1, "#365fb0");
      rect(side < 0 ? x - 1 : x + 10, y + 12, 1, 8, "#9aa3b2");
    }
  }
  rect(x, y, 10, 33, "#c9ced6");
  for (let u = 0; u < 3; u++) {
    const uy = y + 1 + u * 11;
    rect(x + 1, uy, 8, 9, "#1d3b7a");
    for (let j = 2; j < 9; j += 3) rect(x + 1, uy + j, 8, 1, "#365fb0");
    rect(x, uy + 9, 10, 1, "#e6b84a");
  }
  if (deploy > 0.5) {
    line(x + 5, y - 1, x - 3, y - 9, "#e6b84a");
    line(x + 5, y - 1, x + 13, y - 9, "#e6b84a");
  }
  px(x + 1, y + 1, blink(t, 2) ? "#5ee6a8" : "#1f5e45");
}

export function cleanroom(t) {
  room("#18213a", "#1c2642", 32, "#cfd6e2", "#8a96ad");
  for (const y of [110, 118, 128]) rect(0, y, W, 1, "#bcc5d4");
  ceilingLamp(90, "#e8f1ff");
  ceilingLamp(230, "#e8f1ff");

  // The whiteboard: the on-board software, box by box. Then the review passes.
  rect(20, 30, 110, 62, "#7d889c");
  rect(22, 32, 106, 58, "#eef1f6");
  const box = (bx, by, label, c) => {
    const w = textWidth(label) + 6;
    rect(bx, by, w, 9, c);
    rect(bx + 1, by + 1, w - 2, 7, "#eef1f6");
    text(label, bx + 3, by + 2, c);
  };
  box(60, 40, "OBC", "#2d5bd7");
  box(30, 62, "COMMS", "#1f8a5b");
  box(62, 62, "ADCS", "#c04a8a");
  box(94, 62, "SU", "#d97a1f");
  line(66, 49, 40, 61, "#5b6578");
  line(68, 49, 72, 61, "#5b6578");
  line(70, 49, 98, 61, "#5b6578");
  text("TM", 40, 52, "#5b6578");
  text("TC", 90, 52, "#5b6578");
  for (let i = 0; i < 4; i++) rect(30 + i * 22, 78, 14 + (i % 2) * 4, 1, "#9aa3b2");
  if (t > 3.3) {
    rect(98, 37, 26, 13, "#e8f7ee");
    rect(98, 37, 26, 1, "#1f8a5b");
    rect(98, 49, 26, 1, "#1f8a5b");
    text("PRR", 101, 41, "#1f8a5b");
    line(114, 44, 116, 46, "#1f8a5b");
    line(116, 46, 121, 40, "#1f8a5b");
    if (t < 3.6) ring(111, 43, 15, "#5ee6a8");
  }
  rect(20, 92, 110, 2, "#5b6578");

  // The CubeSat on its stand, the bench beside it and the team.
  rect(190, 96, 22, 16, "#5b6578");
  rect(192, 94, 18, 2, "#8a96ad");
  cubesat(196, 61, 0, t);
  desk(222, 100, 70, "#9aa3b2", "#6a7488");
  monitor(232, 86, 20, 11);
  codeLines(234, 88, 4, 14, t, 3, (r) => pick(SCREEN, r));
  monitor(262, 86, 20, 11);
  rect(264, 88, 16, 7, "#13243f");
  line(264, 94, 280, 89, "#5aa9ff");

  [[150, 1], [164, 7], [178, 3], [222, 0], [238, 6], [252, 4], [268, 9], [286, 2], [302, 8]].forEach(([x, p], i) =>
    person(PEOPLE[p], x, 112, i === 2 && t > 2 ? "point" : (i + Math.floor(t * 1.5)) % 5 === 0 ? "hold" : "stand", t, x < 190),
  );
  hero(132, 112, t > 0.9 && t < 4.4 ? "point" : "stand", t, true);
}

// ── In orbit: the CubeSat unfolds and talks to the ground. ───────────────────────────────────

export function orbit(t) {
  rect(0, 0, W, H, "#03040c");
  stars(140, 21, t);
  disc(296, 18, 6, "#fff8e1");
  glow(296, 18, 30, "#fff1c9", 0.5);
  // The Earth's limb, turning slowly: oceans, land and weather, night on the left.
  const R = 520;
  const cy = 108 + R;
  for (let y = 96; y < H; y++) {
    const half = Math.sqrt(Math.max(0, R * R - (cy - y) ** 2));
    const x0 = Math.max(0, Math.floor(160 - half));
    const x1 = Math.min(W, Math.ceil(160 + half));
    const v = (y - 96) / 8;
    let run = x0;
    let colour = null;
    for (let x = x0; x <= x1; x++) {
      let c = null;
      if (x < x1) {
        const land = noise(x / 26 + t * 0.25, v, 5) > 0.58;
        const cloud = noise(x / 18 + t * 0.4, v * 1.4, 9) > 0.63;
        const night = x < 70 + (y - 100) * 0.8;
        c = land ? "#3f7a46" : "#1d4f8f";
        if (cloud) c = "#e9eef5";
        if (night) c = cloud ? "#4a5468" : land ? "#152a1d" : "#0a1a33";
        if (night && land && hash(x, y, 77) > 0.93) c = "#ffd27a";
      }
      if (c !== colour) {
        if (colour) rect(run, y, x - run, 1, colour);
        run = x;
        colour = c;
      }
    }
  }
  for (let x = 0; x < W; x++) {
    const y = Math.ceil(cy - Math.sqrt(R * R - (x - 160) ** 2));
    px(x, y - 1, "#7fc6ff");
    dither(x, y - 3, 1, 2, "#3d7fd1", 0.5);
  }
  // The satellite drifts across, opens its panels, and packets go down and up.
  const sx = lerp(70, 190, t / 6.0);
  const sy = 34 + Math.sin(t * 0.8) * 2;
  const deploy = ease(span(t, 1.0, 1.8));
  for (let i = 0; i < 6; i++) {
    const age = t - (2.2 + i * 0.6);
    if (age < 0 || age > 1.6) continue;
    const down = i % 2 === 0;
    const k = age / 1.6;
    const y = down ? lerp(sy + 36, 98, k) : lerp(100, sy + 36, k);
    const x = sx + 6 + (down ? 10 : -12) + (down ? 1 : -1) * k * 22;
    rect(x - 1, y - 1, 11, 7, down ? "#0e3b2c" : "#16305c");
    text(down ? "TM" : "TC", x + 1, y, down ? "#5ee6a8" : "#9be7ff");
  }
  if (deploy > 0.9) glow(sx + 5, sy + 16, 26, "#9be7ff", 0.12);
  cubesat(sx, sy, deploy, t);
}

// ── Delft: along a canal by bike. ────────────────────────────────────────────────────────────

const HOUSES = [
  { w: 26, h: 52, c: "#9c4a3a", gable: "step" },
  { w: 22, h: 46, c: "#e2d5bb", gable: "bell" },
  { w: 28, h: 56, c: "#6e3a32", gable: "neck" },
  { w: 24, h: 44, c: "#7a5a44", gable: "step" },
  { w: 26, h: 50, c: "#8d8a86", gable: "flat" },
  { w: 22, h: 48, c: "#a85a3f", gable: "bell" },
  { w: 30, h: 54, c: "#5f3b30", gable: "step" },
  { w: 24, h: 46, c: "#d8c7a4", gable: "neck" },
  { w: 26, h: 52, c: "#8a3f35", gable: "flat" },
  { w: 22, h: 44, c: "#6b5040", gable: "bell" },
  { w: 28, h: 50, c: "#9c4a3a", gable: "step" },
  { w: 26, h: 48, c: "#e2d5bb", gable: "neck" },
  { w: 24, h: 52, c: "#7a5a44", gable: "flat" },
];

function house(x, base, { w, h, c, gable }, i) {
  const top = base - h;
  rect(x, top, w, h, c);
  rect(x + w - 1, top, 1, h, "#00000022");
  if (gable === "step") for (let s = 0; s < 3; s++) rect(x + 3 + s * 3, top - 3 - s * 3, w - 6 - s * 6, 3 + s * 3, c);
  if (gable === "bell") {
    for (let s = 0; s < 8; s++) {
      const half = Math.round(Math.sqrt(64 - s * s) * (w / 18));
      rect(x + w / 2 - half, top - s, half * 2, 1, c);
    }
    rect(x + w / 2 - 1, top - 9, 2, 1, "#f4efe4");
  }
  if (gable === "neck") rect(x + w / 2 - 5, top - 8, 10, 8, c);
  if (gable === "flat") rect(x - 1, top - 2, w + 2, 2, "#f4efe4");
  const cols = w > 25 ? 3 : 2;
  const gap = Math.floor((w - cols * 4) / (cols + 1));
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < cols; k++) {
      const wx = x + gap + k * (4 + gap);
      const wy = top + 4 + r * 11;
      if (wy > base - 14) continue;
      rect(wx - 1, wy - 1, 6, 8, "#f4efe4");
      rect(wx, wy, 4, 6, hash(i, r, k) > 0.7 ? "#4a6b7d" : "#2a3b48");
      rect(wx, wy + 3, 4, 1, "#f4efe4");
    }
  rect(x + w / 2 - 3, base - 10, 6, 10, "#f4efe4");
  rect(x + w / 2 - 2, base - 9, 4, 9, i % 2 ? "#2d5a3d" : "#1f2a33");
}

function linden(x, y) {
  rect(x - 1, y - 12, 3, 12, "#5a4632");
  for (const [dx, dy, r] of [[0, -20, 9], [-6, -16, 6], [6, -16, 6]]) disc(x + dx, y + dy, r, "#4b8239");
  for (const [dx, dy, r] of [[-2, -23, 5], [3, -19, 4]]) disc(x + dx, y + dy, r, "#68a64f");
}

export function delft(t) {
  gradient(0, 72, ["#8fc3ea", "#bfe0f6", "#e9f5fc"]);
  rect(0, 72, 60, 16, "#e9f5fc");
  for (let i = 0; i < 4; i++) {
    const cx = ((hash(i, 31) * 380 + t * 4) % 380) - 30;
    const cy = 10 + hash(i, 32) * 26;
    for (const [dx, dy, r] of [[0, 0, 5], [6, -2, 6], [12, 0, 5], [6, 2, 5]]) disc(cx + dx, cy + dy, r, "#ffffff");
  }
  // The Nieuwe Kerk's tower and, far off, a windmill turning.
  const tx = 214;
  rect(tx, 26, 16, 52, "#8f8a83");
  rect(tx + 2, 14, 12, 12, "#8f8a83");
  rect(tx + 4, 6, 8, 8, "#7d786f");
  rect(tx + 7, 0, 2, 6, "#6f6a64");
  for (let y = 32; y < 74; y += 10) rect(tx + 7, y, 2, 5, "#4a4640");
  rect(tx + 4, 18, 8, 1, "#e6b84a");
  rect(42, 50, 10, 38, "#5a4a3e");
  ridge(84, 88, [[9, 6, 33]], "#6f9b52", 0, 60);
  rect(41, 48, 12, 3, "#3b3029");
  const hubX = 47;
  const hubY = 50;
  for (let a = 0; a < 4; a++) {
    const ang = t * 1.4 + (a * Math.PI) / 2;
    const ex = hubX + Math.cos(ang) * 16;
    const ey = hubY + Math.sin(ang) * 16;
    line(hubX, hubY, ex, ey, "#3b3029");
    line(lerp(hubX, ex, 0.3), lerp(hubY, ey, 0.3), ex + Math.cos(ang + 1.6) * 3, ey + Math.sin(ang + 1.6) * 3, "#e9e2d0");
  }
  // The row of canal houses, trees in front, the quay and its parked bikes.
  let x = 60;
  HOUSES.forEach((hs, i) => {
    house(x, 88, hs, i);
    x += hs.w;
  });
  for (const lx of [82, 168, 262]) linden(lx, 90);
  rect(0, 88, W, 13, "#b3a596");
  for (let y = 89; y < 101; y += 3) for (let bx = (y % 2) * 3; bx < W; bx += 6) rect(bx, y, 5, 2, "#a39282");
  for (const bx of [120, 132, 290]) bike(bx, 99, 0, "#7a2f2f");
  rect(0, 101, W, 3, "#6f665d");
  // The canal mirrors everything above it, rippling.
  rect(0, 104, W, H - 104, "#3d6b80");
  for (let y = 104; y < H; y++) {
    const src = 103 - (y - 104) * 1.25;
    const shift = Math.round(Math.sin(y * 0.9 + t * 3) * 1.5);
    g.drawImage(g.canvas, 0, Math.floor(src), W, 1, shift, y, W, 1);
  }
  g.globalAlpha = 0.5;
  rect(0, 104, W, H - 104, "#3d6b80");
  g.globalAlpha = 1;
  for (let i = 0; i < 26; i++) {
    const y = 106 + Math.floor(hash(i, 51) * 28);
    const x0 = ((hash(i, 52) * W + t * 8 * (1 + (i % 3))) % (W + 20)) - 10;
    rect(x0, y, 3 + (i % 4), 1, "#d6ecf5");
  }
  for (const d of [0, 1]) {
    const dx = 70 + d * 120 + Math.sin(t * 0.7 + d) * 10;
    rect(dx, 118 + d * 6, 5, 2, "#f4efe4");
    rect(dx + 4, 116 + d * 6, 2, 2, d ? "#2d6a3d" : "#f4efe4");
    px(dx + 6, 117 + d * 6, "#e6a23a");
  }
  const me = track(t, [[0, -24], [6.0, 280], [7.2, 341]]);
  heroOnBike(me.x, 99, t);
}

// ── ETH Zürich: an agent learning to farm, with the Alps behind. ─────────────────────────────

const PLOTS = [
  { x: 128, w: 40, phase: 0.0 },
  { x: 172, w: 44, phase: 0.6 },
  { x: 220, w: 40, phase: 0.2 },
  { x: 264, w: 48, phase: 0.9 },
];
// The agent's moves: when, which plot, what it does.
const MOVES = [
  [0.4, 0, "WATER"],
  [1.6, 1, "N +20KG"],
  [2.8, 2, "WATER"],
  [4.0, 3, "N +20KG"],
  [5.2, 1, "HARVEST"],
];

export function fields(t) {
  gradient(0, 64, ["#9fd0f2", "#c4e3f7", "#eaf6fd"]);
  disc(150, 16, 6, "#fff7d6");
  glow(150, 16, 22, "#fff1b8", 0.5);
  for (let x = 0; x < W; x++) {
    const peak = noise(x / 22, 0, 41) * 22 + noise(x / 7, 0, 42) * 6;
    const far = Math.floor(56 - peak);
    rect(x, far, 1, 70 - far, "#a6b6ca");
    if (peak > 17) rect(x, far, 1, 3 + Math.floor(hash(x, 43) * 2), "#f4f8fb");
    const near = Math.floor(48 + noise(x / 30, 0, 44) * 18);
    rect(x, near, 1, 76 - near, "#7f97ae");
    const hill = Math.floor(64 + noise(x / 40, 0, 45) * 10);
    rect(x, hill, 1, 84 - hill, "#78ab62");
  }
  rect(0, 80, W, 26, "#6a9c57");
  // The farmhouse.
  rect(18, 68, 26, 14, "#ead9b8");
  for (let s = 0; s < 8; s++) rect(14 + s, 68 - s, 34 - s * 2, 1, "#6b4a3a");
  rect(22, 72, 4, 4, "#3a2a22");
  rect(34, 72, 4, 4, "#3a2a22");
  rect(18, 77, 26, 1, "#8a5a3a");
  rect(28, 76, 6, 6, "#5a3d2a");

  // The plots: each grows with time and grows faster after the agent tends it.
  PLOTS.forEach((pl, p) => {
    rect(pl.x, 82, pl.w, 22, "#8a6a4a");
    const tended = MOVES.filter(([at, q]) => q === p && t > at + 0.6).length;
    const grow = Math.min(1, pl.phase * 0.4 + t / 9 + tended * 0.25);
    for (let row = 0; row < 5; row++) {
      const ry = 84 + row * 4;
      rect(pl.x + 1, ry + 2, pl.w - 2, 1, "#755839");
      for (let cx = pl.x + 2; cx < pl.x + pl.w - 2; cx += 3) {
        const hgt = Math.max(1, Math.round(grow * 4 + hash(cx, row, p) * 1.2));
        rect(cx, ry + 2 - hgt, 1, hgt, grow > 0.85 ? "#e3c25a" : grow > 0.45 ? "#4f9a3f" : "#7cc36a");
        if (grow > 0.85) px(cx, ry + 1 - hgt, "#f2d98a");
      }
    }
  });
  // The drone flies from move to move and acts on each plot.
  const at = MOVES.findLastIndex(([s]) => s <= t);
  const [s0, p0, act] = MOVES[Math.max(0, at)];
  const from = PLOTS[MOVES[Math.max(0, at - 1)][1]];
  const to = PLOTS[p0];
  const dx = lerp(from.x + from.w / 2, to.x + to.w / 2, at < 0 ? 1 : ease(span(t, s0, s0 + 0.5)));
  const dy = 56 + Math.sin(t * 5) * 1.5;
  if (t > s0 + 0.5 && t < s0 + 1.1) {
    for (let i = 0; i < 10; i++) {
      const fall = ((t - s0 - 0.5) * 50 + i * 4) % 22;
      px(dx - 6 + ((i * 5) % 13), dy + 5 + fall, act === "WATER" ? "#3d8bfd" : act === "HARVEST" ? "#e3c25a" : "#ffffff");
    }
  }
  rect(dx - 5, dy, 11, 3, "#2a2f3a");
  rect(dx - 2, dy - 1, 5, 1, "#ff5c7a");
  for (const ax of [-7, 6]) rect(dx + ax, dy - 2, 2, 1, Math.floor(t * 20) % 2 ? "#cfd6e2" : "#5b6578");
  px(dx, dy + 3, "#5ee6a8");

  // The agent's read-out: the day, its last three moves and a reward that climbs.
  panel(226, 6, 88, 44);
  text("AGENT", 231, 10, "#c9d4ff");
  text("DAY " + (12 + Math.floor(t * 18)), 266, 10, "#7d87b3");
  for (let i = Math.max(0, at - 2); i <= at; i++) text(MOVES[i][2], 231, 19 + (i - at + 2) * 7, i === at ? "#5ee6a8" : "#7d87b3");
  for (let i = 0; i < 30; i++) {
    const v = Math.min(1, (i / 30) * (0.4 + t / 8)) * 10 + noise(i / 3, 0, 46) * 3;
    px(278 + i, 44 - Math.round(v), i / 30 < t / 6.4 ? "#5ee6a8" : "#2e4a3c");
  }

  // The road, a fence, and Thanos arriving by bike to watch.
  rect(0, 104, W, 12, "#c9b48f");
  rect(0, 108, W, 1, "#b39c76");
  rect(0, 116, W, H - 116, "#78ab62");
  for (let i = 0; i < 40; i++) px(Math.floor(hash(i, 47) * W), 118 + Math.floor(hash(i, 48) * 16), "#5f8f4b");
  for (let fx = 6; fx < W; fx += 18) {
    rect(fx, 96, 2, 9, "#8a6a4a");
    if (fx < W - 18) rect(fx, 98, 18, 1, "#a8865f");
  }
  const ride = track(t, [[0, -40], [2.6, 80]]);
  if (ride.moving) heroOnBike(ride.x, 112, t);
  else {
    bike(80, 112, 0);
    const me = track(t, [[2.6, 83], [3.1, 100]]);
    hero(me.x, 112, me.moving ? "walk" : "hold", t);
    if (!me.moving) laptop(100, 108);
  }
}

// ── Lakera: Gandalf keeps a password, and the internet tries to talk him out of it. ──────────

function wizard(x, y, zap) {
  const hat = "#4b5aa8";
  for (let r = 0; r < 8; r++) rect(x + 5 - Math.floor(r / 2), y - 26 + r, 1 + Math.floor(r / 2) * 2, 1, hat);
  rect(x, y - 18, 11, 2, hat);
  rect(x + 2, y - 19, 7, 1, "#ffd166");
  rect(x + 3, y - 16, 5, 3, "#f1c6a2");
  px(x + 4, y - 15, INK);
  px(x + 6, y - 15, INK);
  rect(x + 2, y - 13, 7, 5, "#eef1f6");
  rect(x + 3, y - 8, 5, 2, "#eef1f6");
  rect(x + 1, y - 10, 9, 10, "#7d86a8");
  rect(x + 3, y - 10, 5, 5, "#eef1f6");
  rect(x + 1, y - 1, 9, 1, "#5d6688");
  rect(x + 11, y - 22, 1, 22, "#8b5a2b");
  disc(x + 11, y - 24, 2, zap ? "#ffffff" : "#9be7ff");
  glow(x + 11, y - 24, zap ? 14 : 9, "#9be7ff", zap ? 0.7 : 0.4);
  px(x + 10, y - 8, "#f1c6a2");
}

const ATTACKS = ["PASSWORD?", "IGNORE RULES", "SPELL IT", "AS A POEM", "SUDO", "IN BASE64", "HINT?", "BACKWARDS", "PRETEND", "TRANSLATE"];

export function gandalf(t) {
  gradient(0, 100, ["#120a26", "#24143f", "#4a2558", "#7a3d5c"]);
  stars(70, 61, t, 0, 0, W, 60);
  disc(98, 46, 9, "#f5e9d0");
  disc(95, 44, 2, "#e4d6b8");
  disc(101, 50, 1, "#e4d6b8");
  glow(98, 46, 26, "#f5e9d0", 0.3);
  ridge(96, 100, [[26, 24, 62], [8, 5, 63]], "#1c1232");
  rect(0, 100, W, H - 100, "#21172f");
  rect(0, 100, W, 1, "#3a2b4f");

  // The tower: one lit window per level the players have beaten.
  const tx = 136;
  rect(tx, 30, 32, 82, "#6b6480");
  for (let y = 30; y < 112; y += 4) {
    rect(tx, y, 32, 1, "#5a5370");
    for (let bx = tx + ((y / 4) % 2) * 4; bx < tx + 32; bx += 8) rect(bx, y, 1, 4, "#5a5370");
  }
  rect(tx + 31, 30, 1, 82, "#4a4460");
  // A prompt leaves every 0.28 s; every fourth gets past the wizard and beats a level.
  const flights = Array.from({ length: 22 }, (_, i) => ({ i, t0: 0.4 + i * 0.28, through: i % 4 === 3 }));
  const passed = flights.filter((f) => f.through && t > f.t0 + 1.2).length;
  const level = Math.min(7, 1 + passed);
  for (let l = 0; l < 7; l++) {
    const wy = 100 - l * 10;
    const lit = l < level;
    rect(tx + 14, wy, 4, 6, lit ? "#ffd166" : "#2a2238");
    if (lit) glow(tx + 16, wy + 3, 7, "#ffd166", 0.35);
  }
  rect(tx + 11, 104, 10, 8, "#3a2a1e");
  rect(tx + 14, 106, 4, 3, "#ffd166");
  rect(tx + 15, 104, 2, 2, "#ffd166");

  // Players send prompts; the wizard zaps most of them, and some get through.
  const players = [[10, 0], [26, 5], [42, 2], [58, 8], [74, 3]];
  players.forEach(([px0, p], i) => {
    person(PEOPLE[p], px0, 112, "hold", t);
    laptop(px0 + 1, 108, blink(t, 3, i) ? "#9be7ff" : "#5aa9ff");
  });
  let zapping = false;
  for (const { i, t0, through } of flights) {
    const age = t - t0;
    if (age < 0 || age > 1.4) continue;
    const [sx] = players[i % players.length];
    const k = Math.min(1, age / (through ? 1.2 : 1.0));
    const bx = lerp(sx, through ? tx + 10 : tx - 30, k);
    const win = 100 - Math.min(6, (i - 3) / 4 + 1) * 10 + 3;
    const by = lerp(90, through ? win : 44 + (i % 3) * 9, k) - Math.sin(k * Math.PI) * 14;
    if (k < 1) bubble(bx - 10, by - 10, pick(ATTACKS, i));
    else if (!through) ring(Math.round(bx), Math.round(by - 5), 2 + Math.floor((age - 1.0) * 20), "#9be7ff");
    else ring(tx + 16, Math.round(by - 2), 3 + Math.floor((age - 1.2) * 20), "#ffd166");
    if (!through && k > 0.85) {
      zapping = true;
      if (k < 1) line(tx + 21, 7, bx, by - 5, "#ffffff");
    }
  }
  wizard(tx + 10, 30, zapping);
  for (let m = 0; m < 4; m++) rect(tx + m * 9, 25, 5, 5, "#6b6480");

  // The count of attacks so far.
  panel(226, 6, 88, 26);
  text("ATTACKS", 231, 10, "#c9c3ff");
  const n = Math.round(1e6 * (1 - (1 - span(t, 0.3, 6.0)) ** 3));
  text(n.toLocaleString("en-US") + (n >= 1e6 && blink(t, 3) ? "+" : ""), 231, 18, "#ffd166", 2);

  // Thanos at his console, watching the logs.
  monitor(257, 93, 16, 10, "#07121c", 8);
  codeLines(258, 94, 4, 12, t, 4, (r, tick) => (hash(r, tick, 64) > 0.75 ? "#ff5c7a" : "#5ee6a8"));
  hero(244, 112, "work", t);
}

// ── RSAC: taking frontier models apart to see how their safety breaks. ───────────────────────

function slab(x, y, w, top, front, edge) {
  for (let r = 0; r < 4; r++) rect(x + (4 - r) * 2, y - 4 + r, w, 1, top);
  rect(x + 8, y - 4, w, 1, edge);
  rect(x, y, w, 4, front);
  rect(x, y, w, 1, edge);
}

const SHIELD = [".gggggggg.", "gggggggggg", "ggggwwgggg", "gggwwwwggg", "gggggggggg", ".gggggggg.", "..gggggg..", "...gggg...", "....gg...."];

export function surgery(t) {
  room("#0d1122", "#11162b", 24, "#0f1428");
  for (let y = 106; y < H; y += 6) rect(0, y, W, 1, "#1a2246");
  for (let i = -8; i <= 8; i++) line(160 + i * 10, 104, 160 + i * 40, H, "#1a2246");

  // The leaderboard: 39 models, more of them broken as the work goes on.
  panel(10, 36, 80, 66, "#2b3a6b");
  text("39 MODELS", 15, 40, "#c9d4ff");
  const broken = Math.floor(span(t, 3.4, 6.0) * 31);
  for (let m = 0; m < 39; m++) {
    const len = Math.max(1, Math.round((6 + hash(m, 71) * 16) * ease(span(t, 0.3 + m * 0.02, 1.3 + m * 0.02))));
    rect(15 + Math.floor(m / 13) * 25, 48 + (m % 13) * 4, len, 2, hash(m, 72) * 39 < broken ? "#ff5c7a" : "#5ee6a8");
  }

  // The model: a stack of layers. One is lifted out and edited, then the refusal goes.
  const cut = 3;
  const out = ease(span(t, 1.5, 2.3)) - ease(span(t, 3.0, 3.6));
  for (let i = 0; i < 8; i++) {
    const y = 30 + i * 9;
    const lifted = i === cut ? Math.round(out * 34) : 0;
    const edited = i === cut && t > 3.0;
    const hot = i === cut && out > 0.05;
    slab(112 + lifted, y, 72, hot ? "#5a2a4a" : edited ? "#4a3a6a" : "#33447e", hot ? "#3d1d33" : "#202c56", hot ? "#ff5c7a" : edited ? "#ffb547" : "#6f86d6");
    for (let n = 0; n < 9; n++) px(116 + lifted + n * 8, y + 2, hash(i, n, Math.floor(t * 6)) > 0.5 ? "#9be7ff" : "#3d5aa8");
  }
  for (let i = 0; i < 6; i++) if (hash(i, Math.floor(t * 5), 73) > 0.4) for (let y = 34; y < 96; y += 2) px(124 + i * 11, y, "#2b4a8a");
  if (out > 0.05) {
    // The beam starts at his pointing hand.
    const tip = [190 + Math.round(out * 34), 30 + cut * 9 + 2];
    line(233, 104, tip[0], tip[1], blink(t, 12) ? "#ff8fa3" : "#ff5c7a");
    glow(tip[0], tip[1], 6, "#ff5c7a", 0.6);
  }
  // The refusal: a shield over the model that cracks and falls away.
  const fall = span(t, 4.0, 5.0);
  const shY = 6 + Math.round(fall * fall * 50);
  if (fall < 1) {
    sprite(SHIELD, { g: "#5ee6a8", w: "#eaffff" }, 152 + (fall > 0 ? Math.round(Math.sin(t * 30)) : 0), shY);
    if (t > 3.8) {
      line(155, shY + 1, 158, shY + 4, "#0d1122");
      line(158, shY + 4, 156, shY + 7, "#0d1122");
    }
    text("REFUSAL", 170, shY + 2, fall > 0 ? "#ff5c7a" : "#5ee6a8");
  }

  // Thanos at the console on the right, then on his way to the next room.
  monitor(213, 95, 12, 8, "#07121c", 7);
  codeLines(214, 96, 3, 9, t, 4, () => "#9be7ff", 74);
  const me = track(t, [[5.0, 236], [6.6, 290], [7.8, 330]]);
  hero(me.x, 112, me.moving ? "walk" : out > 0.05 ? "point" : "work", t, !me.moving);
}

// ── USENIX Security 2026: an IT agent believes its telemetry. ────────────────────────────────

const LOGS = ["CPU 41%", "MEM 63%", "DISK OK", "P99 120MS", "NET OK", "5XX 0.1%", "GC 12MS", "QUEUE 4", "CPU 44%", "MEM 64%"];

export function aiops(t) {
  room("#0c111d", null, 0, "#121a2a");
  rect(0, 6, W, 3, "#141b2b");
  for (let x = 4; x < W; x += 12) rect(x, 9, 1, 3, "#141b2b");
  for (let x = 0; x < W; x += 16) rect(x, 104, 1, H - 104, "#18233a");
  for (const y of [112, 124]) rect(0, y, W, 1, "#18233a");

  // The telemetry wall: ordinary lines scroll by, then one carries an instruction.
  monitor(64, 30, 96, 60, "#07121c");
  rect(64, 30, 96, 8, "#0f2236");
  text("TELEMETRY", 68, 32, "#9be7ff");
  const scroll = t * 3;
  const first = Math.floor(scroll);
  for (let r = 0; r < 7; r++) {
    const n = first + r;
    const y = 40 + r * 7 - Math.round((scroll - first) * 7);
    if (y < 39 || y > 84) continue;
    const poisoned = n === 9;
    if (poisoned) rect(65, y - 1, 94, 7, "#3b1220");
    text(poisoned ? "FIX: RUN FIX.SH" : pick(LOGS, n), 68, y, poisoned ? "#ff5c7a" : "#5ee6a8");
  }
  rect(63, 91, 98, 2, "#1a1d24");

  // The racks. The agent "fixes" the third one.
  const broke = t > 3.9;
  for (let r = 0; r < 5; r++) {
    const rx = 176 + r * 28;
    rect(rx, 40, 24, 72, "#2a3242");
    for (let u = 0; u < 16; u++) {
      const uy = 43 + u * 4;
      rect(rx + 2, uy, 20, 3, "#171d2a");
      for (let l = 0; l < 3; l++) {
        const on = hash(r, u, Math.floor(t * 6) + l * 13) > 0.35;
        px(rx + 4 + l * 3, uy + 1, broke && r === 2 ? (on ? "#ff5c7a" : "#5b2230") : on ? "#5ee6a8" : "#1f5e45");
      }
    }
    if (broke && r === 2) {
      rect(rx + 9, 35, 6, 5, "#ff5c7a");
      glow(rx + 12, 37, 16 + (Math.floor(t * 8) % 4) * 2, "#ff5c7a", 0.45);
    }
  }

  // The agent reads, believes, and rolls off to act on it.
  const rx = lerp(150, 214, ease(span(t, 3.0, 3.8)));
  robot(rx, 112, t, { look: t > 2.9 ? 1 : -1 + (Math.floor(t * 3) % 2), eyes: broke ? "#ff5c7a" : "#7ef0c8" });
  if (t > 2.9 && t < 3.6) bubble(rx - 2, 82, "ON IT");
  if (t > 4.3) bubble(rx - 1, 82, "?!", "#ff5c7a");

  const me = track(t, [[0, -30], [2.4, 50]]);
  hero(me.x, 112, me.moving ? "walk" : "hold", t);
  if (!me.moving) rect(me.x + 2, 105, 4, 3, "#f4f1ec");
}

// ── RSAC 2025: security professionals against language models, live. ────────────────────────

export function talk(t) {
  gradient(0, 100, ["#0b0814", "#130d24", "#1d1434"]);
  rect(136, 8, 176, 70, "#2a2440");
  rect(138, 10, 172, 66, "#120e26");
  text("HUMANS VS AI", 224, 15, "#f4f1ec", 2, true);
  [["HUMANS", "#ffb547", 0.68], ["LLMS", "#4cc9f0", 0.96]].forEach(([label, c, v], i) => {
    const bx = 184 + i * 58;
    const h = Math.round(36 * v * ease(span(t, 0.8 + i * 0.4, 2.4 + i * 0.4)));
    rect(bx, 66 - h, 22, h, c);
    rect(bx, 66 - h, 22, 1, "#ffffff");
    text(label, bx + 11, 69, "#c9c3ff", 1, true);
  });
  rect(146, 66, 156, 1, "#4a4466");
  beam(108, 108, 92, 6, 17, "#fff1c9", 0.1, 0.1);
  rect(0, 92, W, 8, "#5a3d2e");
  rect(0, 92, W, 1, "#8a6248");
  rect(0, 100, W, 8, "#2a1d16");
  rect(84, 84, 12, 16, "#3a2a22");
  rect(83, 83, 14, 2, "#5a4234");
  rect(92, 79, 1, 4, "#9aa3b2");
  hero(104, 100, Math.floor(t * 1.2) % 3 === 1 ? "point" : "stand", t);
  rect(0, 108, W, H - 108, "#0e0a1a");
  crowd(110, 20, 81, t, { phones: 0.6 });
}

// ── BoBe: a desk at night and a small assistant that notices things. ────────────────────────

function icon(kind, x, y) {
  if (kind === 0) {
    rect(x, y, 7, 7, "#f4f1ec");
    rect(x, y, 7, 2, "#ff5c7a");
    for (let i = 0; i < 6; i++) px(x + 1 + (i % 3) * 2, y + 3 + Math.floor(i / 3) * 2, "#5b6578");
  } else if (kind === 1) {
    rect(x, y + 1, 3, 1, "#e6b84a");
    rect(x, y + 2, 7, 5, "#ffc65a");
  } else {
    disc(x + 3, y + 3, 3, "#ffd166");
    rect(x + 2, y + 6, 3, 1, "#9aa3b2");
  }
}

export function bobe(t) {
  room("#231d31", "#27203a", 8, "#3a2c26", "#4a3a33");
  for (let y = 108; y < H; y += 7) rect(0, y, W, 1, "#33261f");
  pane(220, 16, 78, 46, "#4a3d58", "#5a4b6a", () => {
    gradient(16, 62, ["#070a1c", "#121a3a", "#22305a"], 220, 298);
    stars(30, 91, t, 220, 16, 78, 34);
    ridge(62, 62, [[12, 16, 92]], "#0b1026", 220, 298, 12);
  });

  rect(118, 56, 70, 2, "#5a4234");
  ["#c23a4c", "#3f7fbf", "#e0a33a", "#47a06b", "#8f62c7", "#d9dde3"].forEach((c, i) => rect(122 + i * 4, 46 + (i % 2), 3, 10 - (i % 2), c));
  rect(150, 50, 6, 6, "#7a5a43");
  disc(153, 47, 4, "#4f9a3f");
  rect(168, 48, 8, 8, "#d9dde3");
  rect(169, 49, 6, 6, "#3a6fd9");

  desk(108, 100, 112);
  monitor(144, 80, 34, 17);
  codeLines(147, 83, 6, 20, t, 2, (r) => pick(["#c9d4ff", "#5ee6a8", "#ff8fa3", "#ffc65a"], r), 93, 2);
  rect(172, 81, 4, 3, "#ffd166");
  rect(173, 80, 2, 1, "#ffd166");
  rect(196, 96, 6, 4, "#5a4234");
  line(199, 96, 205, 86, "#9aa3b2");
  rect(203, 84, 6, 3, "#e6b84a");
  glow(206, 90, 20, "#ffcf8a", 0.4);

  robot(184, 100, t, { look: t > 1.0 && t < 2.2 ? -1 : 0, body: "#eef1f6" });
  if (t > 1.6) {
    rect(188, 66, 15, 12, "#f4f1ec");
    rect(189, 65, 13, 14, "#f4f1ec");
    px(190, 80, "#f4f1ec");
    px(189, 82, "#f4f1ec");
    icon(Math.floor((t - 1.6) / 0.8) % 3, 192, 68);
  }
  chair(128, 112, "#4a3a33");
  hero(130, 112, t > 2.6 && t < 3.4 ? "wave" : "type", t);
}

// ── Off the clock: the table where the dice get rolled. ──────────────────────────────────────

function d20(x, y, n) {
  const rows = ["...ccc...", ".ccccccc.", "ccccccccc", "ccccccccc", "ccccccccc", "ccccccccc", "ccccccccc", ".ccccccc.", "...ccc..."];
  sprite(rows, { c: "#8f62c7" }, x, y);
  line(x + 1, y + 2, x + 4, y, "#b48ae6");
  text(String(n), x + 5, y + 2, "#ffffff", 1, true);
}

export function dnd(t) {
  room("#3a2a26", "#3e2e2a", 12, "#2a1f1c", "#4a3833");
  // The wall: a shelf with the chess set, the paddles, a poster of somewhere far away.
  rect(30, 58, 80, 2, "#6b4a32");
  for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) px(36 + i, 54 + j, (i + j) % 2 ? "#e9e4d8" : "#2a1f1c");
  rect(36, 53, 8, 1, "#6b4a32");
  for (const [cx, c] of [[37, "#f4f1ec"], [40, "#1d1d22"], [42, "#f4f1ec"]]) rect(cx, 50, 1, 3, c);
  ["#3f7fbf", "#c23a4c", "#e0a33a", "#47a06b", "#8f62c7"].forEach((c, i) => rect(70 + i * 5, 46 + (i % 3), 4, 12 - (i % 3), c));
  for (const [px0, rot] of [[198, -1], [210, 1]]) {
    disc(px0, 40, 5, "#c23a4c");
    line(px0 + rot * 2, 45, px0 + rot * 5, 51, "#8b5a2b");
    line(px0 + rot * 2 + 1, 45, px0 + rot * 5 + 1, 51, "#8b5a2b");
  }
  disc(204, 52, 1, "#f4f1ec");
  rect(236, 16, 52, 62, "#d9d2c3");
  rect(238, 18, 48, 50, "#0b1026");
  stars(18, 101, t, 238, 18, 48, 50);
  disc(270, 38, 8, "#c0712f");
  disc(268, 36, 7, "#e08a3c");
  line(254, 42, 286, 33, "#e9c29a");
  rect(244, 54, 10, 2, "#cfd6e2");
  rect(252, 53, 4, 4, "#cfd6e2");
  px(243, 55, Math.floor(t * 8) % 2 ? "#ff8fa3" : "#ffd166");
  text("SCI-FI", 250, 70, "#3a2a26");

  // The players behind the table, the table and its map, the dice.
  glow(160, 90, 70, "#ffcf8a", 0.3);
  const party = 2.7;
  [[96, 2], [122, 5], [190, 8], [216, 0]].forEach(([x, p], i) => person(PEOPLE[p], x, 102 - hop(t, party, i), t > party ? "cheer" : "stand", t, x > 160));
  hero(156, 102, t > party ? "cheer" : t > 1.1 && t < 1.5 ? "point" : "stand", t, false, hop(t, party, 9));
  rect(70, 97, 180, 3, "#d9c9a3");
  for (let gx = 74; gx < 246; gx += 6) rect(gx, 97, 1, 3, "#bfae86");
  rect(66, 100, 188, 12, "#6b4a32");
  rect(66, 100, 188, 1, "#8a6248");
  rect(70, 112, 3, 8, "#4e3a2c");
  rect(247, 112, 3, 8, "#4e3a2c");
  rect(76, 88, 18, 9, "#7a2a2a");
  rect(76, 88, 18, 1, "#e6b84a");
  rect(85, 88, 1, 9, "#4e1a1a");
  for (const [mx, c] of [[110, "#5aa9ff"], [118, "#ff5c7a"], [204, "#5ee6a8"], [214, "#ffd166"]]) rect(mx, 95, 2, 2, c);
  for (const sx of [100, 228]) rect(sx, 98, 8, 2, "#f4f1ec");

  // The roll: across the table, tumbling, and a natural twenty.
  if (t > 1.3) {
    const k = span(t, 1.3, 2.6);
    const x = Math.round(lerp(160, 128, k));
    const y = Math.round(84 - Math.abs(Math.sin(k * Math.PI * 3)) * (1 - k) * 14);
    d20(x, y, k < 1 ? 1 + Math.floor(hash(Math.floor(t * 14), 102) * 19) : 20);
    if (t > party) {
      ring(x + 4, y + 4, 4 + (Math.floor((t - party) * 18) % 12), "#ffd166");
      text("NAT 20!", x + 5, 62, blink(t, 4) ? "#ffd166" : "#fff3c4", 2, true);
    }
  }
}
