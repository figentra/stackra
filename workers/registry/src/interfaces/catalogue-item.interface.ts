/**
 * Stackra file contract:
 * Purpose: `CatalogueItem`: one catalogue entry, metadata only.
 * Boundary: types and the kinds list only. Stand-in: ADR 0453 names `@stackra/skills/contracts` as the home of these
 *           shapes (stackra-184, not built yet); when it lands, the Worker imports them from there and these local
 *           copies go.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 11 and 12).
 */
import type { CatalogueVersion } from "#src/interfaces/catalogue-version.interface";
import type { StackraKind } from "#src/interfaces/stackra-kind.type";
import type { StackraManifest } from "#src/interfaces/stackra-manifest.interface";

/** One catalogue entry, metadata only. */
export interface CatalogueItem {
  readonly name: string;
  readonly scope: string;
  readonly kind: StackraKind;
  readonly description: string | null;
  readonly latest: string | null;
  readonly distTags: Readonly<Record<string, string>>;
  readonly access: "open" | "licensed";
  readonly licence: string | null;
  readonly keywords: readonly string[];
  readonly repository: string | null;
  readonly homepage: string | null;
  readonly publishedAt: string;
  readonly deprecated: string | null;
  readonly stackra: StackraManifest;
  /** Present on the one-item read only. */
  readonly versions?: readonly CatalogueVersion[];
}
