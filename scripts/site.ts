// Every file the build writes, by path: the cards in both themes and README.md. build.ts writes
// them and check.ts makes sure what is committed matches.
import { looks } from "../shared/theme";
import { heroSvg } from "./hero";
import { researchCards, projectCards, repoCards } from "./cards";
import { readme } from "./readme";

export function outputs(): Map<string, string> {
  const files = new Map<string, string>();
  for (const [mode, look] of Object.entries(looks)) {
    for (const size of ["wide", "narrow"] as const) files.set(`assets/hero-${size}-${mode}.svg`, heroSvg(look, size));
    for (const c of [...researchCards, ...projectCards, ...repoCards]) files.set(`assets/${c.name}-${mode}.svg`, c.draw(look));
  }
  files.set("README.md", readme());
  return files;
}
