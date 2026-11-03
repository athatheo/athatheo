// Everything the profile says, in one place. build.ts turns it into the cards and README.md.
// Facts come from the CV; links point at the papers, talks and code themselves.

export const NAME = "Athanasios Theocharis";
export const ROLE = "Principal AI Research Scientist at RSAC";
export const ABOUT =
  "I research how frontier LLMs and AI agents break. I built Gandalf, a red-teaming game that drew over a million attacks, and led the flight software team of a CubeSat.";

export type Research = {
  slug: string;
  venue: string;
  title: string;
  body: string;
  action: string;
  kind: "paper" | "talk";
  href: string;
};

export const RESEARCH: Research[] = [
  {
    slug: "aiops",
    venue: "USENIX Security 2026",
    title: "When AIOps Become “AI Oops”",
    body: "Subverting LLM-driven IT operations by manipulating the telemetry their agents read.",
    action: "Paper · arXiv 2508.06394",
    kind: "paper",
    href: "https://arxiv.org/abs/2508.06394",
  },
  {
    slug: "gandalf-red",
    venue: "ICML 2025",
    title: "Gandalf the Red",
    body: "Adaptive security for LLM applications, studied on crowd-sourced attacks from Gandalf.",
    action: "Paper · arXiv 2501.07927",
    kind: "paper",
    href: "https://arxiv.org/abs/2501.07927",
  },
  {
    slug: "llms-vs-experts",
    venue: "IEEE S&P Workshops 2026",
    title: "LLMs vs. Experts",
    body: "A human-calibrated benchmark for cybersecurity knowledge, with LLMs scored against experts.",
    action: "About the study",
    kind: "paper",
    href: "https://www.rsaconference.com/library/blog/human-experts-cant-beat-most-llms-at-a-cybersecurity-knowledge-competition",
  },
  {
    slug: "humans-vs-ai",
    venue: "RSAC 2025, San Francisco",
    title: "Humans vs. AI",
    body: "Security professionals against LLMs in a live cybersecurity quiz battle.",
    action: "Session · RSAC 2025",
    kind: "talk",
    href: "https://www.rsaconference.com/Library/presentation/USA/2025/Humans%20vs%20AI%20-%20Insights%20from%20a%20Cybersecurity%20Quiz%20Battle",
  },
];

// The big cards. Their pictures are stills from the film: `at` seconds into a scene, from art row
// `top` down.
export type Project = { slug: string; name: string; line: string; body: string; meta: string; href: string; still: { scene: string; at: number; top: number } };

export const PROJECTS: Project[] = [
  {
    slug: "gandalf",
    name: "Gandalf",
    line: "gandalf.lakera.ai",
    body: "The LLM red-teaming game I built at Lakera. Players tried over a million ways to talk the wizard out of his password.",
    meta: "Lakera · 2023–2024",
    href: "https://gandalf.lakera.ai",
    still: { scene: "gandalf", at: 6.2, top: 0 },
  },
  {
    slug: "acubesat",
    name: "AcubeSAT",
    line: "ESA Fly Your Satellite! 3",
    body: "A 3U CubeSat built with the European Space Agency. I led its ten-person software team through ESA's technical reviews.",
    meta: "SpaceDot · C++ · 2018–2023",
    href: "https://gitlab.com/acubesat",
    still: { scene: "orbit", at: 4.2, top: 16 },
  },
];

export type Repo = { slug: string; name: string; body: string; meta: string; href: string };

export const REPOS: Repo[] = [
  {
    slug: "tri-bonsai",
    name: "tri-bonsai",
    body: "Fine-tuning the 1.58-bit Ternary Bonsai models without leaving the ternary grid. GRPO from scratch, in MLX.",
    meta: "Python · MLX",
    href: "https://github.com/athatheo/tri-bonsai",
  },
  {
    slug: "bonsai-fold",
    name: "bonsai-fold",
    body: "Training-free compression of the 1-bit Bonsai 27B, 19% smaller, measured end to end on one 64 GB Mac.",
    meta: "Python · MLX",
    href: "https://github.com/athatheo/bonsai-fold",
  },
  {
    slug: "bobe",
    name: "BoBe",
    body: "A local-first, proactive AI companion for macOS. I prototyped its agentic layer.",
    meta: "Rust · Swift",
    href: "https://github.com/Sombrace/BoBe",
  },
  {
    slug: "ecss-services",
    name: "ecss-services",
    body: "The ECSS Packet Utilization Standard in C++, written for the AcubeSAT nanosatellite.",
    meta: "C++",
    href: "https://github.com/AcubeSAT/ecss-services",
  },
];

// Where the name at the top of the page links.
export const HERO_LINK = "https://x.com/atha_theo";

export const LINKS: [string, string][] = [
  ["X", "https://x.com/atha_theo"],
  ["GitLab", "https://gitlab.com/athatheo"],
  ["Email", "mailto:athatheoc@gmail.com"],
  ["How this page works", "https://github.com/athatheo/athatheo/blob/main/HOW-IT-WORKS.md"],
];

// What the film shows, for screen readers and anyone who can't watch it.
export const FILM_ALT =
  "A short pixel-art film. In a Thessaloniki lab at night, Thanos analyses colorectal cancer data in R for iGEM Greece, then walks on stage at the 2017 iGEM Giant Jamboree as his team wins a gold medal. At SpaceDot he presents the AcubeSAT flight software as it passes ESA's Production Readiness Review, and the CubeSat unfolds its panels in orbit. He cycles along a canal at TU Delft and through Swiss farmland where an RL agent tends crops for ETH Zürich. At Lakera, players fire over a million prompts at Gandalf the wizard. At RSAC he lifts a layer out of a frontier model and its refusal falls away, an IT agent is fooled by poisoned telemetry, and he presents Humans vs. AI at RSAC 2025. At night he works with BoBe, a small AI assistant on his desk, then rolls a natural 20 with friends at the D&D table.";
