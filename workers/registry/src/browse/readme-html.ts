/**
 * Stackra file contract:
 * Purpose: `readmeHtml`: one version's README as HTML, read from its tarball in R2 once and kept in KV (a version is
 *          immutable, so the entry never goes stale); "" when the version has no README or no tarball.
 * Boundary: reads only; read rules are the caller's (the browser calls it only when the request may read the name).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3 and 7).
 */
import { renderMarkdown } from "#src/browse/render-markdown";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import { tarballKey } from "#src/npm/tarball-key";
import { readTarball } from "#src/publish/read-tarball";

/**
 * One version's README as HTML, or "" when it has none.
 *
 * @example
 * await readmeHtml(deps, "@stackra/core", "0.1.0"); // "<h1 id=…"
 */
export async function readmeHtml(
  deps: RegistryDeps,
  name: string,
  version: string,
): Promise<string> {
  const key = `browse:readme:${name}@${version}`;
  const cached = await deps.cache.get(key);
  if (cached !== null) return cached;
  const object = await deps.tarballs.get(tarballKey(name, version));
  if (object === null) return "";
  let html: string;
  try {
    const bytes = new Uint8Array(await new Response(object.body).arrayBuffer());
    const { readme } = await readTarball(bytes, deps.settings.maxUnpackedBytes);
    html = readme === undefined ? "" : renderMarkdown(readme);
  } catch {
    // A tarball the publish accepted always reads; an unreadable one shows no README rather than failing the page.
    return "";
  }
  await deps.cache.put(key, html);
  return html;
}
