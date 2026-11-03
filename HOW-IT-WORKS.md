# How this profile works

- **The film.** A pixel-art film drawn in code, in `story/`. `seek(canvas, t)` draws any moment
  on a 320×136 canvas, scaled 3× without smoothing, and sets the captions in Inter on top. A
  headless browser renders it frame by frame (`story/render.ts`); the README shows it as an
  animated WebP, with a still for readers who turn motion off, and `story/index.html` plays the
  same code live.
- **Cards.** Every card is an SVG in `assets/`, drawn by `scripts/` (Bun and TypeScript) from
  `scripts/profile.ts`, which also writes README.md. Each SVG carries small subsets of Inter and
  JetBrains Mono, because an SVG shown as an image can't load fonts. The pictures on the project
  cards are stills from the film.
- **Themes and phones.** `<picture>` sources pick the dark or light version by GitHub theme, and
  the name block has its own phone layout.

You need [Bun](https://bun.sh), and for the film also Playwright's Chromium
(`bunx playwright install chromium`), `img2webp` from libwebp and, for `--mp4`, ffmpeg. The
preview uses the GitHub CLI, logged in.

To change what the page says, edit `scripts/profile.ts`, then:

```sh
bun install
bun run build          # draw assets/ and write README.md
bun run preview        # the profile on localhost:8790, rendered by GitHub's Markdown API
bun run check          # types, links, pictures, alt text, fonts, both themes
```

If you add a project or change the moment its card shows (`still` in `profile.ts`), run
`bun run posters` before building. When the film itself changes:

```sh
bun run film           # assets/story.webp, its still and the cards' stills (add --mp4 for a video)
bun run build          # redraw the cards with the new stills
```

To watch it live, serve the repository (for example `bunx serve .`) and open `story/index.html`;
`?t=12.5` holds one moment.

The idea, a film and cards drawn in code, comes from
[John Kozaris's profile](https://github.com/johnkozaris).
