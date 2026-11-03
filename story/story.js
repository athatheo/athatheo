// The story so far, as a short pixel-art film. seek(canvas, t) draws the frame at t seconds, so
// the same code plays live on a page and renders frame by frame to video (render.ts).
// Art is drawn at 320x136 and scaled 3x without smoothing; captions are set at full size.
import { W, H, art, g, canvas, rect, fade, iris, ease, lerp, during, bayer } from "./pixel.js";
import { stage, hero, heroOnBike } from "./cast.js";
import * as S from "./scenes.js";

export const SCALE = 3;
export const FONTS = { head: "600 28px Inter", line: "400 16px Inter" };

// How each scene hands over to the next, and how long that takes:
//   walk      the camera pushes on and Thanos walks (or rides) into the next scene
//   cut       straight on
//   tilt      the camera tilts down from orbit to the ground
//   iris      a circle closes on Thanos and opens on him again
//   dissolve  the next scene shows through the last, dithered
//   fade      a dithered fade through black
const TAKES = { walk: 1.2, cut: 0, tilt: 1.4, iris: 0.6, dissolve: 0.8, fade: 0.5 };

// Captions are facts from the CV: a name, then one plain line. Each is [from, to, head, line],
// and is kept clear of the transitions at either end of its scene.
const SCENES = [
  { len: 5.6, draw: S.lab, out: "walk", captions: [[0.7, 4.6, "iGEM Greece", "Bioinformatics for colorectal cancer, in R"]] },
  { len: 5.4, draw: S.jamboree, out: "iris", captions: [[1.0, 5.4, "iGEM Giant Jamboree 2017", "Gold medal and a Best Therapeutics nomination"]] },
  { len: 5.4, draw: S.cleanroom, out: "cut", captions: [[0.7, 4.9, "AcubeSAT at SpaceDot", "Lead software engineer for a team of ten"]] },
  { len: 6.0, draw: S.orbit, out: "tilt", captions: [[0.6, 4.6, "ESA Fly Your Satellite! 3", "Flight software through ESA's Production Readiness Review"]] },
  { len: 6.0, draw: S.delft, out: "walk", light: true, captions: [[0, 5.4, "TU Delft", "M.Sc. Computer Science, AI Technology track"]] },
  { len: 6.4, draw: S.fields, out: "iris", light: true, captions: [[1.3, 6.4, "ETH Zürich", "Reinforcement learning for crops across 1000 km²"]] },
  {
    len: 7.0,
    draw: S.gandalf,
    out: "dissolve",
    captions: [
      [0.8, 3.7, "Gandalf, at Lakera", "A red-teaming game for LLMs that I built"],
      [4.0, 6.6, "Over a million attacks", "Analysed at scale and fed back into guard models"],
    ],
  },
  {
    len: 6.6,
    draw: S.surgery,
    out: "walk",
    captions: [
      [0.9, 3.5, "RSAC", "Principal AI Research Scientist"],
      [3.8, 6.2, "Breaking frontier LLMs", "Weight surgery, layer merging, refusal ablation"],
    ],
  },
  { len: 6.0, draw: S.aiops, out: "iris", captions: [[1.3, 6.0, "When AIOps become “AI Oops”", "USENIX Security 2026: IT agents misled by their telemetry"]] },
  { len: 5.2, draw: S.talk, out: "fade", captions: [[0.8, 4.6, "RSAC 2025, San Francisco", "Humans vs. AI: a cybersecurity quiz battle"]] },
  { len: 4.6, draw: S.bobe, out: "dissolve", captions: [[0.8, 4.0, "BoBe", "A proactive AI assistant that stays on your machine"]] },
  { len: 5.8, draw: S.dnd, out: "fade", captions: [[0.9, 5.0, "Off the clock", "Sci-fi, D&D, chess and table tennis"]] },
];

let at = 0;
for (const s of SCENES) {
  s.from = at;
  at += s.len;
}
export const DURATION = at;

// The film time `seconds` into the scene drawn by scenes.js's function `name`.
export const timeIn = (name, seconds) => SCENES.find((s) => s.draw.name === name).from + seconds;

const buffer = () => {
  const c = canvas(W, H);
  c.getContext("2d", { willReadFrequently: true });
  return c;
};
const [bufA, bufB] = [buffer(), buffer()];

// Every frame starts from solid black, so nothing from the frame before can show through.
const blank = () => rect(0, 0, W, H, "#05060b");

// Draws one scene at a local time, copies it into a buffer if given one, and says where it put
// Thanos.
function shot(scene, local, buf) {
  stage.hero = null;
  blank();
  scene.draw(local);
  buf?.getContext("2d").drawImage(art, 0, 0);
  return stage.hero;
}

// The first moments of a scene, while the previous one hands over.
function handOver(prev, scene, local) {
  const k = ease(local / TAKES[prev.out]);
  stage.hideHero = prev.out === "walk";
  const a = shot(prev, prev.len + local, bufA);
  const b = shot(scene, local, bufB);
  stage.hideHero = false;
  blank();
  if (prev.out === "walk") {
    // The camera pushes on while Thanos keeps going, from where the last scene has him to where
    // this one picks him up, in step with this scene's clock.
    const cam = Math.round(k * W);
    g.drawImage(bufA, -cam, 0);
    g.drawImage(bufB, W - cam, 0);
    if (!a || !b) return;
    const x = lerp(a.x, W + b.x, local / TAKES.walk) - cam;
    const y = Math.round(lerp(a.y, b.y, k));
    if (b.ride) heroOnBike(x, y, local);
    else hero(x, y, "walk", local);
  } else if (prev.out === "tilt") {
    const cam = Math.round(k * H);
    g.drawImage(bufA, 0, -cam);
    g.drawImage(bufB, 0, H - cam);
  } else {
    const shown = bufA.getContext("2d").getImageData(0, 0, W, H);
    const into = new Uint32Array(shown.data.buffer);
    const next = new Uint32Array(bufB.getContext("2d").getImageData(0, 0, W, H).data.buffer);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (bayer(x, y) < k) into[y * W + x] = next[y * W + x];
    g.putImageData(shown, 0, 0);
  }
}

// iris and fade cover the screen at the end of one scene and the start of the next; the others
// play over the start of the next scene, drawing both. The film opens with a fade from black.
const covers = (how) => how === "iris" || how === "fade";

function caption(ctx, scene, into, local) {
  const ink = scene.light ? "#1d2330" : "#f4f1ec";
  const shadow = scene.light ? "rgba(255,255,255,0.75)" : "rgba(5,6,11,0.85)";
  const set = (str, font, y) => {
    ctx.font = font;
    ctx.fillStyle = shadow;
    ctx.fillText(str, 32, y + 2);
    ctx.fillStyle = ink;
    ctx.fillText(str, 30, y);
  };
  const clear = scene.len - (covers(scene.out) ? TAKES[scene.out] : 0);
  for (const [a, b, head, line] of scene.captions) {
    const k = during(local, Math.max(a, TAKES[into]), Math.min(b, clear));
    if (k <= 0) continue;
    ctx.globalAlpha = k;
    set(head, FONTS.head, 48);
    set(line, FONTS.line, 72);
    ctx.globalAlpha = 1;
  }
}

export function seek(out, t, { captions = true } = {}) {
  t = ((t % at) + at) % at;
  const i = SCENES.findLastIndex((s) => s.from <= t);
  const scene = SCENES[i];
  const prev = SCENES[i - 1];
  const into = prev?.out ?? "fade";
  const local = t - scene.from;
  if (!covers(into) && local < TAKES[into]) handOver(prev, scene, local);
  else shot(scene, local);
  const centre = stage.hero ? [stage.hero.x + 4, stage.hero.y - 9] : [W / 2, H / 2];
  if (into === "iris" && local < TAKES.iris) iris(...centre, ease(local / TAKES.iris) * 340);
  if (scene.out === "iris" && local > scene.len - TAKES.iris) iris(...centre, ease((scene.len - local) / TAKES.iris) * 340);
  if (into === "fade") fade(1 - ease(local / TAKES.fade));
  if (scene.out === "fade") fade(ease((local - (scene.len - TAKES.fade)) / TAKES.fade));
  const ctx = out.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, 0, 0, W * SCALE, H * SCALE);
  if (captions) caption(ctx, scene, into, local);
}
