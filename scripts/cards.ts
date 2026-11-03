// The linked cards under the hero: research first, then projects. Each is 416 wide, so two sit
// side by side in GitHub's README column and they stack on narrower screens.
import { existsSync, readFileSync } from "node:fs";
import { ROOT } from "../shared/files";
import { SANS, MONO, esc, type Look } from "../shared/theme";
import { RESEARCH, PROJECTS, REPOS, type Research, type Project, type Repo } from "./profile";
import { lines, svgDoc, arrow, play, paper } from "./svg";

const W = 416;

// One card: where it links, what it says to screen readers, and how it looks in each theme.
export type Card = { name: string; href: string; alt: string; draw: (l: Look) => string };

const frame = (l: Look, h: number, r: number) => `<rect x="1.5" y="1.5" width="${W - 3}" height="${h - 3}" rx="${r}" fill="${l.surface}" stroke="${l.border}"/>`;

function researchSvg(l: Look, c: Research, alt: string): string {
  const H = 156;
  let body = frame(l, H, 12);
  body += `<text x="20" y="34" class="k">${esc(c.venue)}</text>`;
  body += `<text x="20" y="62" class="t">${esc(c.title)}</text>`;
  body += lines(c.body, "inter-400", 13.5, W - 44, 20, 87, 19.5, `class="b"`).svg;
  body += c.kind === "talk" ? play(21, H - 26, l.accent) : paper(20, H - 26, l.accent);
  body += `<text x="38" y="${H - 21.5}" class="a">${esc(c.action)}</text>`;
  body += arrow(W - 34, H - 26, l.accent);
  const css =
    `.k{font:500 12.5px ${SANS};fill:${l.faint}}.t{font:600 18px ${SANS};letter-spacing:-.25px;fill:${l.ink}}` +
    `.b{font:400 13.5px ${SANS};fill:${l.muted}}.a{font:500 13px ${SANS};fill:${l.accentText}}`;
  return svgDoc(W, H, alt, ["inter-400", "inter-500", "inter-600"], css, body);
}

// `art` is a PNG still from the film; the picture takes its shape.
function projectSvg(l: Look, c: Project, alt: string, art: Buffer): string {
  const H = 336;
  const pic = { x: 10, y: 10, w: W - 20, h: Math.round(((W - 20) * art.readUInt32BE(20)) / art.readUInt32BE(16)) };
  let body = frame(l, H, 16);
  body +=
    `<clipPath id="pic"><rect x="${pic.x}" y="${pic.y}" width="${pic.w}" height="${pic.h}" rx="9"/></clipPath>` +
    `<image href="data:image/png;base64,${art.toString("base64")}" x="${pic.x}" y="${pic.y}" width="${pic.w}" height="${pic.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#pic)" style="image-rendering:pixelated"/>` +
    `<rect x="${pic.x + 0.5}" y="${pic.y + 0.5}" width="${pic.w - 1}" height="${pic.h - 1}" rx="8.5" fill="none" stroke="${l.border}"/>`;
  const ty = pic.y + pic.h + 38;
  body += `<text x="20" y="${ty}" class="n">${esc(c.name)}</text>`;
  body += `<text x="20" y="${ty + 23}" class="l">${esc(c.line)}</text>`;
  body += lines(c.body, "inter-400", 14, W - 44, 20, ty + 50, 20, `class="b"`).svg;
  body += `<text x="20" y="${H - 22}" class="m">${esc(c.meta)}</text>`;
  body += arrow(W - 34, H - 26, l.accent);
  const css =
    `.n{font:600 21px ${SANS};letter-spacing:-.3px;fill:${l.ink}}` +
    `.l{font:400 12.5px ${MONO};fill:${l.faint}}.b{font:400 14px ${SANS};fill:${l.muted}}.m{font:400 12px ${MONO};fill:${l.faint}}`;
  return svgDoc(W, H, alt, ["inter-400", "inter-600", "mono-400"], css, body);
}

// The smaller open-source projects, two to a row under the two big cards.
function repoSvg(l: Look, c: Repo, alt: string): string {
  const H = 120;
  let body = frame(l, H, 12);
  body += `<text x="20" y="34" class="n">${esc(c.name)}</text>`;
  body += lines(c.body, "inter-400", 13.5, W - 64, 20, 58, 19, `class="b"`).svg;
  body += `<text x="20" y="${H - 18}" class="m">${esc(c.meta)}</text>`;
  body += arrow(W - 34, H - 24, l.accent);
  const css = `.n{font:600 16px ${SANS};letter-spacing:-.2px;fill:${l.ink}}.m{font:400 12px ${MONO};fill:${l.faint}}.b{font:400 13.5px ${SANS};fill:${l.muted}}`;
  return svgDoc(W, H, alt, ["inter-400", "inter-600", "mono-400"], css, body);
}

export const researchCards: Card[] = RESEARCH.map((c) => {
  const alt = `${c.title}, ${c.venue}: ${c.body} ${c.action}.`;
  return { name: `research-${c.slug}`, href: c.href, alt, draw: (l) => researchSvg(l, c, alt) };
});

export const projectCards: Card[] = PROJECTS.map((c) => {
  const alt = `${c.name}, ${c.line}: ${c.body} ${c.meta}.`;
  const file = `${ROOT}art/${c.slug}.png`;
  if (!existsSync(file)) throw new Error(`art/${c.slug}.png is missing: run \`bun run posters\``);
  const art = readFileSync(file);
  return { name: `project-${c.slug}`, href: c.href, alt, draw: (l) => projectSvg(l, c, alt, art) };
});

export const repoCards: Card[] = REPOS.map((c) => {
  const alt = `${c.name}: ${c.body} ${c.meta}.`;
  return { name: `repo-${c.slug}`, href: c.href, alt, draw: (l) => repoSvg(l, c, alt) };
});
