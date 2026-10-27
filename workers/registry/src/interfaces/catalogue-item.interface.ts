/**
 * Stackra file contract:
 * Purpose: `CatalogueItem`: one catalogue entry, metadata only.
 * Boundary: types and the kinds list only. Stand-in: ADR 0453 names `@stackra/skills/contracts` as the home of these
 *           shapes (stackra-184, not built yet); when it lands, the Worker imports them from there and these local
 *           copies go.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 11 and 12).
 */
import type { CatalogueVersion } from "#src/interfaces/catalogue-version.interface";
import type { StackraKind } from "#src/interfaces/stackra-kind.type";
import type { StackraManifest } from "#src/interfaces/stackra-manifest.interface";

/** One catalogue entry, metadata only. */
export interface CatalogueItem {
  /** The full package name, `@scope/name`. */
  readonly name: string;
  /** The scope the package belongs to. */
  readonly scope: string;
  /** The Stackra kind the package declares. */
  readonly kind: StackraKind;
  /** The package.json description of the latest version, or null. */
  readonly description: string | null;
  /** The version the `latest` dist-tag points at, or null before any publish. */
  readonly latest: string | null;
  /** Every dist-tag of the package, mapped to its version. */
  readonly distTags: Readonly<Record<string, string>>;
  /** Whether reading the package needs a licence token. */
  readonly access: "open" | "licensed";
  /** The package.json license of the latest version, or null. */
  readonly licence: string | null;
  /** The package.json keywords of the latest version. */
  readonly keywords: readonly string[];
  /** The source repository URL of the latest version, or null. */
  readonly repository: string | null;
  /** The homepage URL of the latest version, or null. */
  readonly homepage: string | null;
  /** When the package last changed, as an ISO 8601 timestamp. */
  readonly publishedAt: string;
  /** The deprecation message of the latest version, or null when it is not deprecated. */
  readonly deprecated: string | null;
  /** The `stackra` manifest field of the latest version. */
  readonly stackra: StackraManifest;
  /** Present on the one-item read only. */
  readonly versions?: readonly CatalogueVersion[];
}
