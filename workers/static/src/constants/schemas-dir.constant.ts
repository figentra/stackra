/**
 * Stackra file contract:
 * Purpose: where the repository keeps its JSON Schemas (written by STA-305), relative to the repository root.
 * Boundary: a constant only; the readers in src/site resolve it against the root they are given.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files).
 */

/**
 * Repository-relative folder of the schema sources. Only files ending in `.schema.json` directly inside it are
 * published; a missing folder (before STA-305 lands, or at an old tag) means "no schemas", not an error.
 */
export const SCHEMAS_DIR = "tools/schemas";
