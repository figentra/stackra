/**
 * Stackra file contract:
 * Purpose: `CatalogueClient`, the CLI's port to the registry: look an item up in the catalogue API and fetch one
 *          version's tarball, already checked against its integrity.
 * Boundary: type only. `httpCatalogueClient` is the real one; tests pass a fake.
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 4, 8 and 12).
 */
import type { CatalogueItem } from "@stackra/skills/contracts";

/** Reads the registry for `stackra add`. */
export type CatalogueClient = {
  /** The item named (`@stackra/skill-archify`), with its versions, or null when the registry has no such name. */
  readonly item: (name: string) => Promise<CatalogueItem | null>;

  /** The `.tgz` bytes of one version and their SHA-512 integrity (SRI form), refused when they differ. */
  readonly tarball: (
    name: string,
    version: string,
  ) => Promise<{ readonly bytes: Uint8Array; readonly integrity: string }>;
};
