/**
 * Stackra file contract:
 * Purpose: `catalogueItem`: `GET /-/stackra/v1/catalogue/@scope/name`.
 * Boundary: metadata only, to anyone, for the `open` and `licensed` scopes; never a tarball or file contents beyond
 *           the `stackra` field. `internal` scopes are not listed.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 11, 12 and 13).
 */
import { itemOf } from "#src/catalogue/item-of";
import { publicCache } from "#src/catalogue/public-cache";
import { failure } from "#src/http/failure";
import { json } from "#src/http/json";
import type { CatalogueItem } from "#src/interfaces/catalogue-item.interface";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";

/** Serves one catalogue entry with its versions, `GET /-/stackra/v1/catalogue/@scope/name`. */
export async function catalogueItem(deps: RegistryDeps, name: string): Promise<Response> {
  const pkg = await deps.store.package(name);
  const scope = pkg === null ? null : await deps.store.scope(pkg.scope);
  if (pkg === null || scope === null || scope.read_rule === "internal")
    return failure(404, "not_found");
  const [versions, distTags] = await Promise.all([
    deps.store.versions(name),
    deps.store.distTags(name),
  ]);
  const latest = versions.find((row) => row.version === distTags.latest) ?? null;
  const item = itemOf(
    {
      name,
      scope: pkg.scope,
      kind: pkg.kind,
      modified_at: pkg.modified_at,
      read_rule: scope.read_rule,
      latest: latest?.version ?? null,
      manifest: latest?.manifest ?? null,
      deprecated: latest?.deprecated ?? null,
    },
    distTags,
  );
  const body: CatalogueItem = {
    ...item,
    versions: versions.map((row) => ({
      version: row.version,
      publishedAt: row.published_at,
      deprecated: row.deprecated,
    })),
  };
  return json(body, 200, publicCache(deps));
}
