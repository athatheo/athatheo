// README.md, put together from profile.ts around the cards.
import { esc } from "../shared/theme";
import { FILM_ALT, HERO_LINK, LINKS } from "./profile";
import { HERO_ALT } from "./hero";
import { researchCards, projectCards, repoCards, type Card } from "./cards";

// A card that follows GitHub's theme: the dark picture when the reader uses the dark theme.
const card = ({ name, href, alt }: Card) =>
  `<a href="${href}"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg"><img src="assets/${name}-light.svg" alt="${esc(alt)}"></picture></a>`;

// The hero also swaps to a phone layout, so it can't pick its theme with <source> as well: GitHub
// hides each link by theme instead, from the fragment on its href.
const hero = (mode: "dark" | "light") =>
  `<a href="${HERO_LINK}#gh-${mode}-mode-only"><picture><source media="(max-width: 600px)" srcset="assets/hero-narrow-${mode}.svg"><img src="assets/hero-wide-${mode}.svg" alt="${esc(HERO_ALT)}"></picture></a>`;

const centred = (...lines: string[]) => `<p align="center">\n${lines.join("\n")}\n</p>`;

export function readme(): string {
  const sections = [
    // Readers who turn motion off get one frame of the film instead of the loop.
    centred(`<a href="https://github.com/athatheo/athatheo/tree/main/story"><picture><source media="(prefers-reduced-motion: reduce)" srcset="assets/story-still.png"><img src="assets/story.webp" width="100%" alt="${esc(FILM_ALT)}"></picture></a>`),
    centred(hero("dark"), hero("light")),
    `<h3 align="center">Research</h3>`,
    centred(...researchCards.map(card)),
    `<h3 align="center">Projects</h3>`,
    centred(...projectCards.map(card)),
    centred(...repoCards.map(card)),
    centred(`<sub>${LINKS.map(([label, href]) => `<a href="${href}">${label}</a>`).join(" · ")}</sub>`),
  ];
  return sections.join("\n\n") + "\n";
}
