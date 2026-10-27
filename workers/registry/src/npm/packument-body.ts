/**
 * Stackra file contract:
 * Purpose: `packumentBody`: the packument body of a package, from KV or rendered (and then stored); null for an
 *          unknown package.
 * Boundary: rendering and the KV cache only; read rules are the caller's.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3, 4, 8 and 9).
 */
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import { packumentKey } from "#src/npm/packument-key";
import { renderPackument } from "#src/npm/render-packument";

/**
 * The packument body of a package, from KV or rendered (and then stored); null for an unknown package.
 *
 * @example
 * const body = await packumentBody(deps, "@stackra/core", false);
 */
export async function packumentBody(
  deps: RegistryDeps,
  name: string,
  abbreviated: boolean,
): Promise<string | null> {
  const key = packumentKey(name, abbreviated);
  const cached = await deps.cache.get(key);
  if (cached !== null) return cached;
  const pkg = await deps.store.package(name);
  if (pkg === null) return null;
  const [versions, distTags] = await Promise.all([
    deps.store.versions(name),
    deps.store.distTags(name),
  ]);
  const body = JSON.stringify(
    renderPackument(pkg, versions, distTags, deps.settings.host, abbreviated),
  );
  await deps.cache.put(key, body);
  return body;
}
