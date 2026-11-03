// A local preview of the profile before pushing. README.md goes through GitHub's own Markdown
// renderer, so whatever its sanitizer strips is stripped here too, and sits in a mock of the page.
//   bun run preview      http://localhost:8790
//   ?w=343               README column width in px, as on a phone; the hero only switches to its
//                        phone layout when the window itself is narrow
import { ROOT, serveFile } from "../shared/files";
import { looks } from "../shared/theme";

const PORT = 8790;
const token = (await Bun.$`gh auth token`.text()).trim();

async function rendered(): Promise<string> {
  const res = await fetch("https://api.github.com/markdown", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" },
    body: JSON.stringify({ text: await Bun.file(`${ROOT}README.md`).text(), mode: "gfm", context: "athatheo/athatheo" }),
  });
  if (!res.ok) throw new Error(`markdown API ${res.status}: ${await res.text()}`);
  // Point the images back at the files here, which may not be pushed yet.
  return (await res.text())
    .replace(/(src|srcset)="https:\/\/camo\.githubusercontent\.com\/[^"]+"([^>]*?)data-canonical-src="([^"]+)"/g, '$1="$3"$2')
    .replace(/https:\/\/(?:github\.com\/athatheo\/athatheo\/(?:raw|blob)|raw\.githubusercontent\.com\/athatheo\/athatheo)\/(?:HEAD|main)\//g, "/");
}

const css = await Bun.file(`${ROOT}node_modules/github-markdown-css/github-markdown.css`).text();

const page = (body: string, w: number) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview: github.com/athatheo</title><style>${css}
body{margin:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
@media (prefers-color-scheme:dark){body{background:#0d1117}.box{border-color:${looks.dark.border}!important}}
.note{font:500 13px -apple-system,BlinkMacSystemFont,sans-serif;text-align:center;padding:8px;background:#fff8c5;color:#3b2300}
.box{border:1px solid ${looks.light.border};border-radius:6px;padding:24px;width:${w}px;margin:24px auto;box-sizing:content-box}
.box .markdown-body{background:transparent}
/* GitHub hides these links by theme; the preview follows the system setting instead. */
@media (prefers-color-scheme:dark){[href$="#gh-light-mode-only"]{display:none}}
@media (prefers-color-scheme:light){[href$="#gh-dark-mode-only"]{display:none}}
</style></head><body><div class="note">Local preview of github.com/athatheo, not published.</div>
<div class="box"><article class="markdown-body">${body}</article></div></body></html>`;

// Only this machine: the page spends the gh token and the server reads files from the repo.
Bun.serve({
  hostname: "127.0.0.1",
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname !== "/") return serveFile(url.pathname, { "cache-control": "no-store" });
    try {
      const html = page(await rendered(), Number(url.searchParams.get("w")) || 846);
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    } catch (e) {
      return new Response(String(e), { status: 500 });
    }
  },
});
console.log(`preview on http://localhost:${PORT}`);
