/**
 * Stackra file contract:
 * Purpose: `itemOf`: A catalogue item of a row and its tags.
 * Boundary: metadata only, to anyone, for the `open` and `licensed` scopes; never a tarball or file contents beyond
 *           the `stackra` field. `internal` scopes are not listed.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 11, 12 and 13).
 */
import type { CatalogueItem } from "#src/interfaces/catalogue-item.interface";
import type { CatalogueRow } from "#src/interfaces/catalogue-row.interface";
import type { StackraKind } from "#src/interfaces/stackra-kind.type";
import type { StackraManifest } from "#src/interfaces/stackra-manifest.interface";

/** A repository field (string or `{ url }`) as a URL. */
const repositoryOf = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  const url = (value as { url?: unknown } | null | undefined)?.url;
  return typeof url === "string" ? url : null;
};

/** A catalogue item of a row and its tags. */
export function itemOf(
  row: CatalogueRow,
  distTags: Readonly<Record<string, string>>,
): CatalogueItem {
  const manifest = (row.manifest === null ? {} : JSON.parse(row.manifest)) as Record<
    string,
    unknown
  >;
  const stackra = (manifest.stackra ?? {}) as Record<string, unknown>;
  const keywords = Array.isArray(manifest.keywords)
    ? manifest.keywords.filter((word): word is string => typeof word === "string")
    : [];
  return {
    name: row.name,
    scope: row.scope,
    kind: row.kind as StackraKind,
    description: typeof manifest.description === "string" ? manifest.description : null,
    latest: row.latest,
    distTags,
    access: row.read_rule,
    licence: typeof manifest.license === "string" ? manifest.license : null,
    keywords,
    repository: repositoryOf(manifest.repository),
    homepage: typeof manifest.homepage === "string" ? manifest.homepage : null,
    publishedAt: row.modified_at,
    deprecated: row.deprecated,
    stackra: { ...stackra, kind: row.kind as StackraKind } as StackraManifest,
  };
}
