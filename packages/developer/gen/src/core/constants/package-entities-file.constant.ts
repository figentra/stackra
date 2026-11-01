/**
 * Stackra file contract:
 * Purpose: `PACKAGE_ENTITIES_FILE`, a package's committed entity list (`src/node/entities.gen.ts`), written by gen and
 *          compared by `gen --check` like the manifest (STA-1874, ADR 0294 R10 as amended 2026-11-01).
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (R10, amended 2026-11-01); ADR 0295 (amended 2026-11-01); STA-1874.
 */

/** A package's committed entity file, relative to its root. */
export const PACKAGE_ENTITIES_FILE = "src/node/entities.gen.ts";
