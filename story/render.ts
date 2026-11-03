// Renders the film with a headless browser and encodes it.
//   bun story/render.ts                    -> assets/story.webp, the README's loop; its still for
//                                             readers who turn motion off; the project cards' stills
//   bun story/render.ts --mp4              -> story/out/story.mp4 as well, for sharing elsewhere
//   bun story/render.ts --posters          -> only the stills in art/
//   bun story/render.ts --sheet 1,8.5,20   -> story/out/sheet.png, those moments side by side
//   bun story/render.ts --cast             -> story/out/cast.png, everyone in the film up close
import { chromium } from "playwright";
import { mkdirSync, rmSync } from "node:fs";
import { ROOT, serveFile } from "../shared/files";
import { PROJECTS } from "../scripts/profile";

const out = `${ROOT}story/out`;
const flag = (k: string) => process.argv.includes(`--${k}`);
const arg = (k: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i < 0 ? undefined : process.argv[i + 1] ?? "";
};
// The stills are 120 of the film's 136 rows, so they fit the cards' picture shape.
const STILL_ROWS = 120;
// The moment shown instead of the film to readers who ask for reduced motion.
const COVER = { scene: "gandalf", at: 5.2 };

// The page loads ES modules, so it needs a server rather than file://.
const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: (req) => serveFile(new URL(req.url).pathname) });
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => {
  console.error("page error:", e.message);
  process.exitCode = 1;
});
page.on("console", (m) => {
  if (m.type() === "error") console.error("console:", m.text());
});
await page.goto(`http://localhost:${server.port}/story/index.html?t=0`);
await page.evaluate(() => (window as any).ready);

const png = (dataUrl: string) => Buffer.from(dataUrl.slice(22), "base64");

async function frames(dir: string, fps: number): Promise<string[]> {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const duration: number = await page.evaluate(() => (window as any).DURATION);
  const files: string[] = [];
  for (let f = 0; f < Math.round(duration * fps); f++) {
    const file = `${dir}/${String(f).padStart(5, "0")}.png`;
    await Bun.write(file, png(await page.evaluate((t) => (window as any).still(t), f / fps)));
    files.push(file);
    if (f % 120 === 0) console.log(`frame ${f}`);
  }
  return files;
}

async function posters() {
  mkdirSync(`${ROOT}art`, { recursive: true });
  for (const { slug, still } of PROJECTS) {
    const data: string = await page.evaluate(([s, rows]) => (window as any).poster(s.scene, s.at, s.top, rows), [still, STILL_ROWS] as const);
    await Bun.write(`${ROOT}art/${slug}.png`, png(data));
    console.log(`art/${slug}.png`);
  }
}

try {
  const sheet = arg("sheet");
  if (flag("cast")) {
    await Bun.write(`${out}/cast.png`, png(await page.evaluate(() => (window as any).castSheet())));
    console.log("story/out/cast.png");
  } else if (sheet !== undefined) {
    const times = sheet.split(",").map(Number);
    if (!sheet || times.some((t) => !Number.isFinite(t))) throw new Error(`--sheet wants seconds like 1,8.5,20, not "${sheet}"`);
    await Bun.write(`${out}/sheet.png`, png(await page.evaluate((ts) => (window as any).sheet(ts), times)));
    console.log(`story/out/sheet.png: ${times.join(", ")}`);
  } else if (flag("posters")) {
    await posters();
  } else {
    // The README loop: a lossless animated WebP at 12 fps. Flat pixel art compresses better without
    // loss than with it, and every frame stays exact.
    const dir = `${out}/frames-12`;
    const pngs = await frames(dir, 12);
    await Bun.$`img2webp -loop 0 -lossless -m 6 -d 83 ${pngs} -o ${ROOT}assets/story.webp`.quiet();
    rmSync(dir, { recursive: true, force: true });
    console.log(`assets/story.webp: ${pngs.length} frames at 12 fps`);
    const cover = await page.evaluate(({ scene, at }) => (window as any).still((window as any).timeIn(scene, at)), COVER);
    await Bun.write(`${ROOT}assets/story-still.png`, png(cover));
    console.log("assets/story-still.png");
    await posters();
    if (flag("mp4")) {
      // For sharing elsewhere: 30 fps and doubled with nearest neighbour so the pixels stay sharp.
      const video = `${out}/frames-30`;
      await frames(video, 30);
      await Bun.$`ffmpeg -v error -y -framerate 30 -i ${video}/%05d.png -vf scale=1920:-2:flags=neighbor -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart ${out}/story.mp4`;
      rmSync(video, { recursive: true, force: true });
      console.log("story/out/story.mp4");
    }
  }
} finally {
  await browser.close();
  server.stop();
}
