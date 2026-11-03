// The top of the profile: the name and a few plain facts, set in the same type as the cards.
// The narrow version is for phones, where the name takes two lines.
import { SANS, type Look } from "../shared/theme";
import { NAME, ROLE, ABOUT } from "./profile";
import { lines, f2, svgDoc } from "./svg";

export const HERO_ALT = `${NAME}. ${ROLE}. ${ABOUT}`;

const SIZES = {
  wide: { W: 846, name: 56, role: 21, about: 16.5, text: 800, aboutText: 660 },
  narrow: { W: 360, name: 40, role: 17, about: 15, text: 330, aboutText: 330 },
};

export function heroSvg(l: Look, size: keyof typeof SIZES): string {
  const s = SIZES[size];
  const middle = `text-anchor="middle"`;
  const name = lines(NAME, "inter-600", s.name, s.text, s.W / 2, s.name * 1.08, s.name * 1.08, `${middle} class="name"`);
  const role = lines(ROLE, "inter-500", s.role, s.text, s.W / 2, name.last + 8 + s.role * 1.4, s.role * 1.4, `${middle} class="role"`);
  const about = lines(ABOUT, "inter-400", s.about, s.aboutText, s.W / 2, role.last + 10 + s.about * 1.5, s.about * 1.5, `${middle} class="about"`);
  const css =
    `.name{font:600 ${s.name}px ${SANS};letter-spacing:${f2(-s.name * 0.03)}px;fill:${l.ink}}` +
    `.role{font:500 ${s.role}px ${SANS};fill:${l.ink}}` +
    `.about{font:400 ${s.about}px ${SANS};fill:${l.muted}}`;
  return svgDoc(s.W, Math.ceil(about.last + 18), HERO_ALT, ["inter-400", "inter-500", "inter-600"], css, name.svg + role.svg + about.svg);
}
