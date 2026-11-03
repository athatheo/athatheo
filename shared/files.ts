// The repository's root, and the small file server the renderer and the preview share.
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));

// A file from the repository by URL path, never from outside it.
export async function serveFile(pathname: string, headers: HeadersInit = {}): Promise<Response> {
  let path: string;
  try {
    path = decodeURIComponent(pathname).replace(/\.\.+/g, "").replace(/^\/+/, "");
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const file = Bun.file(`${ROOT}${path}`);
  return (await file.exists()) ? new Response(file, { headers }) : new Response("Not found", { status: 404 });
}
