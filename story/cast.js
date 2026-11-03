// The people in the film, put together from parts: a head with its hair, a body in its clothes
// and legs in a pose. Everyone is 8 pixels wide and stands 16 tall on y.
import { px, rect, line, ring, sprite } from "./pixel.js";

// Faces look a little to the right; flip turns them round.
const HEADS = {
  quiff: ["...hhHh.", "..hhhhhh", ".hhhhhhh", ".hssssh.", ".ssesesS", ".sssssS.", "..sbbS..", "...ss..."],
  short: ["........", "..hhhh..", ".hhhhhhh", ".hssssh.", ".ssesesS", ".sssssS.", "..ssSS..", "...ss..."],
  long: ["........", "..hhhh..", ".hhhhhhh", "hhssssh.", "hssesesh", "hsssssSh", "hhssSShh", "h..ss..h"],
  bun: ["...hh...", "..hhhh..", ".hhhhhhh", ".hssssh.", ".ssesesS", ".sssssS.", "..ssSS..", "...ss..."],
  curly: ["..hhhh..", ".hhhhhhh", "hhhhhhhh", "hhssssh.", ".ssesesS", ".sssssS.", "..ssSS..", "...ss..."],
  bald: ["........", "..ssss..", ".sssssS.", ".ssssss.", ".ssesesS", ".sssssS.", "..bbbb..", "...ss..."],
  cap: ["........", "..hhhh..", ".hhhhhhH", ".hssss..", ".ssesesS", ".sssssS.", "..ssSS..", "...ss..."],
  pony: ["........", "..hhhh..", ".hhhhhhh", "hhssssh.", "h.sesesS", "hhsssS..", "h.ssSS..", "...ss..."],
};

const BODY = [".twttwt.", "ttwttwtt", "ttTTTTtt", ".tttttt."];

// Arms as [x, y, colour key] pixels relative to the body's top-left. type is seated at a
// keyboard; work is the same, standing.
const ARMS = {
  down: [[0, 1, "T"], [0, 2, "T"], [0, 3, "s"], [7, 1, "T"], [7, 2, "T"], [7, 3, "s"]],
  type: [[0, 1, "T"], [0, 2, "T"], [1, 3, "s"], [7, 1, "T"], [8, 2, "T"], [9, 2, "s"]],
  cheer: [[0, 0, "T"], [-1, -1, "T"], [-1, -2, "s"], [7, 0, "T"], [8, -1, "T"], [8, -2, "s"]],
  point: [[0, 1, "T"], [0, 2, "T"], [0, 3, "s"], [7, 0, "T"], [8, 0, "T"], [9, 0, "T"], [10, 0, "s"]],
  wave: [[0, 1, "T"], [0, 2, "T"], [0, 3, "s"], [7, 0, "T"], [8, -1, "T"], [8, -2, "s"]],
  hold: [[0, 1, "T"], [1, 2, "s"], [7, 1, "T"], [6, 2, "s"]],
};
ARMS.work = ARMS.type;

const LEGS = {
  stand: [".pppppp.", ".pP..pP.", ".pP..pP.", ".kk..kk."],
  apart: [".pppppp.", ".pP..pP.", "pP....pP", "kk....kk"],
  passing: [".pppppp.", "..pPpP..", "..pPpP..", "..kkkk.."],
  sit: [".pppppp.", ".pPpppp.", ".kk..kk.", "........"],
};

export const INK = "#24170f";

// Thanos, and the people he works with.
export const THANOS = { head: "quiff", hair: "#5b3d2a", hairLight: "#7b5741", skin: "#f1c6a2", shade: "#d49d7b", beard: "#c08d70", top: "#c23a4c", topShade: "#922838", trim: "#f2e4df", pants: "#33466c", pantsShade: "#253352", shoes: "#eeeeee" };

const look = (head, hair, skin, shade, top, topShade, pants, extra = {}) => ({ head, hair, skin, shade, top, topShade, pants, pantsShade: pants, shoes: "#2b2730", ...extra });

export const PEOPLE = [
  look("long", "#2a1c17", "#c58b62", "#a46f4c", "#3f7fbf", "#2d6299", "#3a3a48"),
  look("short", "#e2c27a", "#f3cdb0", "#d8a98a", "#47a06b", "#2f7d50", "#4a4136"),
  look("curly", "#1b1414", "#8a5a3c", "#6d452d", "#e0a33a", "#b9812a", "#2e3a4f"),
  look("bun", "#7a3523", "#f4d0b5", "#d9ab8f", "#8f62c7", "#6d48a0", "#3b3b46"),
  look("bald", "#3a2a22", "#d29c74", "#b07e5a", "#2f9aa0", "#227479", "#433a32", { beard: "#4a3528" }),
  look("pony", "#c9a25a", "#f0c8a8", "#d2a283", "#de6f4f", "#b5543a", "#2f3346"),
  look("cap", "#2d4f8a", "#e8b993", "#c99572", "#ececf0", "#c8c8d2", "#3d4b63"),
  look("short", "#cfcfd6", "#efc6a6", "#cf9f80", "#6d7a8c", "#525d6d", "#2c2f38", { glasses: true }),
  look("long", "#9b4a26", "#f6d6be", "#dbb096", "#4f8f4a", "#3a6d36", "#3c3a46"),
  look("curly", "#3b2618", "#b97d58", "#9a6243", "#c84f78", "#a03b5e", "#333545"),
];

export const LAB_COAT = { top: "#eef0f3", topShade: "#c9ced6" };

// Draws someone standing on y. pose: stand, walk, sit, type, work, cheer, point, wave or hold.
export function person(who, x, y, pose = "stand", t = 0, flip = false) {
  const pal = {
    h: who.hair,
    H: who.hairLight ?? who.hair,
    s: who.skin,
    S: who.shade,
    e: INK,
    b: who.beard ?? who.skin,
    t: who.top,
    T: who.topShade,
    w: who.trim ?? who.top,
    p: who.pants,
    P: who.pantsShade,
    k: who.shoes,
  };
  x = Math.round(x);
  const top = Math.round(y) - 16;
  const walking = pose === "walk";
  // Four steps a second: legs apart, then passing with a bob, and again.
  const passing = walking && Math.floor(t * 8) % 2 === 1;
  const bob = passing ? -1 : 0;
  const legs = walking ? (passing ? LEGS.passing : LEGS.apart) : pose === "sit" || pose === "type" ? LEGS.sit : LEGS.stand;
  sprite(legs, pal, x, top + 12, flip);
  sprite(BODY, pal, x, top + 8 + bob, flip);
  sprite(HEADS[who.head], pal, x, top + bob, flip);
  if (who.glasses) rect(flip ? x + 1 : x + 2, top + 4 + bob, 5, 1, "#2a2a33");
  const arms = ARMS[walking ? (passing ? "down" : "hold") : pose] ?? ARMS.down;
  for (const [ax, ay, k] of arms) px(flip ? x + 7 - ax : x + ax, top + 8 + bob + ay, pal[k]);
}

// A bicycle seen from the side, facing right, with its wheels on y.
export function bike(x, y, t = 0, frame = "#2c3e50") {
  x = Math.round(x);
  y = Math.round(y);
  const spin = Math.floor(t * 10) % 2;
  for (const cx of [x + 3, x + 15]) {
    ring(cx, y - 4, 4, "#1d1d22", 16);
    px(cx + (spin ? 1 : -1), y - 4 + (spin ? -1 : 1), "#9aa3ad");
  }
  rect(x + 3, y - 5, 12, 1, frame);
  line(x + 3, y - 4, x + 7, y - 9, frame);
  rect(x + 7, y - 9, 1, 5, frame);
  rect(x + 13, y - 10, 1, 6, frame);
  rect(x + 5, y - 10, 4, 1, "#1d1d22");
  rect(x + 12, y - 11, 3, 1, "#1d1d22");
}

// Someone riding that bicycle, pedalling.
export function cyclist(who, x, y, t) {
  bike(x, y, t);
  person(who, x + 3, y - 6, "type", t);
  const pedal = Math.floor(t * 6) % 2;
  rect(Math.round(x) + 8 + pedal, Math.round(y) - 5 + pedal, 2, 1, who.pants);
}

// Where each scene put Thanos this frame. Transitions read it to carry him from one scene into
// the next and to centre the iris on him; they hide him while they draw him themselves.
export const stage = { hideHero: false, hero: null };

// `lift` raises him off y, for jumping, without moving where the iris looks for him.
export function hero(x, y, pose, t, flip = false, lift = 0) {
  stage.hero = { x, y, ride: false };
  if (!stage.hideHero) person(THANOS, x, y - lift, pose, t, flip);
}

export function heroOnBike(x, y, t) {
  stage.hero = { x, y, ride: true };
  if (!stage.hideHero) cyclist(THANOS, x, y, t);
}
