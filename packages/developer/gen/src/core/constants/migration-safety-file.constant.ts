/**
 * Stackra file contract:
 * Purpose: `MIGRATION_SAFETY_FILE`, the path under a service root where gen writes the ADR 0159 class of each compiled
 *          migration (`stackra.migration-safety/v1`), which `runway evidence` reads.
 * Boundary: a constant only. Outside `.stackra/migrations`, so neither the runner nor the Encore copy reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3); ADR 0533 (decision 3); ADR 0295 (generated output lives in `.stackra/`).
 */

/** The migration safety file. */
export const MIGRATION_SAFETY_FILE = ".stackra/migration-safety.json";
