/**
 * Stackra file contract:
 * Purpose: `snapshotKey`, the key of a migrations set: a SHA-256 of its files (name and SQL), the PGlite build path and the extension list.
 * Boundary: pure; another migrations set, PGlite build or extension list gives another key, so a snapshot is never stale.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

import type { MigrationFile } from "#node/types/migration-file.type";
import { PGLITE_EXTENSION_NAMES } from "#testing/constants/pglite-extension-names.constant";

/** The PGlite build, as its resolved path (the pnpm store path carries the version); resolved on first use. */
let pgliteBuild: string | undefined;

/** The key of `files`. */
export function snapshotKey(files: readonly MigrationFile[]): string {
  // An optional peer: resolved here, not at import, so importing `./testing` never needs it (STA-1950).
  pgliteBuild ??= createRequire(import.meta.url).resolve("@electric-sql/pglite");
  const hash = createHash("sha256").update(pgliteBuild).update(PGLITE_EXTENSION_NAMES.join(","));
  for (const file of files) hash.update(`\0${file.name}\0${file.sql}`);
  return hash.digest("hex");
}
