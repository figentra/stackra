/**
 * Stackra file contract:
 * Purpose: `RUNWAY_SCHEMA_KINDS`, the runway kinds whose JSON Schema `@stackra/runway` ships; `tools/schemas` holds the
 *          canonical file.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0296.
 */

/** The runway kinds whose JSON Schema `@stackra/runway` ships; `tools/schemas` holds the canonical file (ADR 0296). */
export const RUNWAY_SCHEMA_KINDS: readonly string[] = ["app", "root", "service"];
