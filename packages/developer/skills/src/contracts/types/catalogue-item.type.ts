/**
 * Stackra file contract:
 * Purpose: `CatalogueItem`, one item as the registry's catalogue API lists it (`GET /-/stackra/v1/catalogue`):
 *          metadata only, never a tarball or file contents beyond `stackra`. The one-item endpoint adds `versions`.
 * Boundary: type only; `CATALOGUE_ITEM_SCHEMA` checks it. The Worker (stackra-182) writes it, the CLI reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decisions 11 and 12).
 */
import type { StackraKind } from "#contracts/enums/stackra-kind.enum";
import type { StackraPackageField } from "#contracts/types/stackra-package-field.type";

/** One registry item in the catalogue. */
export type CatalogueItem = {
  /** The full package name, `@stackra/skill-archify`. */
  readonly name: string;
  /** The scope, `@stackra` or `@stackra-pro`. */
  readonly scope: string;
  /** The item kind from its `stackra` field. */
  readonly kind: StackraKind;
  /** The `package.json` description of the latest version, when it has one. */
  readonly description: string | null;
  /** The `latest` dist-tag's version. */
  readonly latest: string;
  /** Every dist-tag with the version it points at. */
  readonly distTags: Readonly<Record<string, string>>;
  /** The scope's read rule: `open` needs no token, `licensed` needs a licence grant. */
  readonly access: "open" | "licensed";
  /** The SPDX licence of the latest version. */
  readonly licence: string | null;
  /** The `package.json` keywords of the latest version. */
  readonly keywords: readonly string[];
  /** The source repository URL of the latest version, when it names one. */
  readonly repository: string | null;
  /** The homepage URL of the latest version, when it names one. */
  readonly homepage: string | null;
  /** ISO 8601 time of the latest publish. */
  readonly publishedAt: string;
  /** The deprecation message, when the latest version is deprecated. */
  readonly deprecated: string | null;
  /** The `stackra` field of the latest version's `package.json`. */
  readonly stackra: StackraPackageField;
  /** Every published version, oldest first; only on `GET /-/stackra/v1/catalogue/@scope/name`. */
  readonly versions?: readonly string[] | undefined;
};
