// Draws every card in assets/ and writes README.md around them, all from profile.ts.
// The project stills come from the film: `bun run film` (or `bun run posters`) makes them.
import { ROOT } from "../shared/files";
import { outputs } from "./site";

const files = outputs();
await Promise.all([...files].map(([path, text]) => Bun.write(`${ROOT}${path}`, text)));
console.log(`built ${files.size} files`);
