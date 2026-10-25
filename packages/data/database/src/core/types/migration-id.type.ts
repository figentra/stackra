/**
 * Stackra file contract:
 * Purpose: `MigrationId`, the derived id of one migration: `<module>.<NNNN>_<snake(stem)>`, such as
 *          `search.0001_create_text_functions`.
 * Boundary: a branded string type only. Gen derives each id from the file path, locks it in `stackra.manifest.json`
 *           and writes the typed `Migrations` object of `#stackra/migrations`, so a migration names another in
 *           `Migration({ after: [...] })` without typing the string.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 as amended by ADR 0305 (order: number, `after:`, macro edges); ADR 0294 (decision 20).
 */
import type { Branded } from "@stackra/contracts";

/** A migration id. */
export type MigrationId = Branded<string, "MigrationId">;
