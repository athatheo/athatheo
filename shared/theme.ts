// The profile's look: GitHub's own neutral surfaces, so the pictures sit in the page, and the
// crimson of the hoodie Thanos wears in the film as the one accent. Two of each, because
// <picture> picks by GitHub theme.
import { readFileSync } from "node:fs";
import { ROOT } from "./files";

export type Look = {
  surface: string;
  border: string;
  ink: string;
  muted: string;
  faint: string;
  accent: string;
  accentText: string;
};

export const looks: Record<"dark" | "light", Look> = {
  dark: {
    surface: "#151b23",
    border: "#3d444d",
    ink: "#f0f6fc",
    muted: "#9198a1",
    faint: "#7d8590",
    accent: "#ef6f7c",
    accentText: "#f59aa4",
  },
  light: {
    surface: "#f6f8fa",
    border: "#d1d9e0",
    ink: "#1f2328",
    muted: "#59636e",
    faint: "#68717b",
    accent: "#c23a4c",
    accentText: "#a82e40",
  },
};

export const SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";

const faces = {
  "inter-400": ["Inter", 400],
  "inter-500": ["Inter", 500],
  "inter-600": ["Inter", 600],
  "mono-400": ["JetBrains Mono", 400],
} as const;

export type FaceName = keyof typeof faces;

export const fontFile = (face: FaceName) => `${ROOT}fonts/${face}.woff2`;

// An SVG shown as an image cannot fetch fonts, so each one carries its own subset.
export function fontFaces(names: FaceName[]): string {
  return names
    .map((n) => {
      const [family, weight] = faces[n];
      const data = readFileSync(fontFile(n)).toString("base64");
      return `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${data}) format('woff2')}`;
    })
    .join("");
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
