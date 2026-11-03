// The profile's checks: everything committed is what the build writes, everything README.md
// shows is here and described, the cards are sound, and nothing private is on the page.
//   bun run check
import { readdirSync } from "node:fs";
import { ROOT } from "../shared/files";
import { outputs } from "./site";
import { PROJECTS } from "./profile";

const failures: string[] = [];
let checks = 0;
const expect = (ok: boolean, message: string) => {
  checks++;
  if (!ok) failures.push(message);
};

const built = outputs();
for (const [path, text] of built) {
  const file = Bun.file(`${ROOT}${path}`);
  expect((await file.exists()) && (await file.text()) === text, `${path} is out of date: run \`bun run build\``);
}

const md = built.get("README.md")!;
for (const [, path] of md.matchAll(/(?:src|srcset)="([^"]+)"/g)) expect(await Bun.file(`${ROOT}${path}`).exists(), `README.md shows ${path}, which is missing`);
for (const [tag] of md.matchAll(/<img [^>]*>/g)) expect(/ alt="[^"]{20,}"/.test(tag), `an image without a real description: ${tag.slice(0, 80)}`);
for (const [, href] of md.matchAll(/href="([^"]+)"/g)) expect(/^(https:\/\/|mailto:)/.test(href), `a link that goes nowhere useful: ${href}`);

const svgs = [...built.keys()].filter((p) => p.endsWith(".svg"));
const stale = readdirSync(`${ROOT}assets`).filter((f) => f.endsWith(".svg") && !built.has(`assets/${f}`));
expect(stale.length === 0, `assets/ has cards the build no longer makes: ${stale.join(", ")}`);
for (const path of svgs) {
  const svg = built.get(path)!;
  expect(svg.includes('role="img"') && /<title>[^<]{10,}<\/title>/.test(svg), `${path} has no role or title for screen readers`);
  expect(svg.includes("@font-face"), `${path} doesn't carry its fonts`);
  expect(!/(?:href|src)="https?:/.test(svg), `${path} loads something over the network, which GitHub blocks`);
}
const xmllint = Bun.which("xmllint");
if (xmllint) {
  const lint = await Bun.$`${xmllint} --noout ${svgs.map((p) => `${ROOT}${p}`)}`.nothrow().quiet();
  expect(lint.exitCode === 0, `cards that are not well-formed:\n${lint.stderr}`);
}

// The film's own existence is covered by README.md's pictures above; here, its weight.
const film = Bun.file(`${ROOT}assets/story.webp`);
if (await film.exists()) expect(film.size < 8 * 1024 * 1024, `assets/story.webp is ${(film.size / 1048576).toFixed(1)} MB, too heavy for a profile`);
const stills = readdirSync(`${ROOT}art`).filter((f) => f.endsWith(".png")).sort().join(", ");
const wanted = PROJECTS.map((p) => `${p.slug}.png`).sort().join(", ");
expect(stills === wanted, `art/ has ${stills}, but the projects want ${wanted}: run \`bun run posters\``);

// The page is public: no phone numbers in it or in what it is built from.
const words = md + (await Bun.file(`${ROOT}scripts/profile.ts`).text());
expect(!/\(?\+\d{1,3}\)?[\s-]?\d[\d\s-]{7,}/.test(words), "there is a phone number on the page");

if (failures.length) {
  console.error(failures.map((f) => `✗ ${f}`).join("\n"));
  process.exit(1);
}
console.log(`✓ ${checks} checks passed`);
