/**
 * Stackra file contract:
 * Purpose: `LOCAL_ENVIRONMENTS`, the environments the local developer MCP may write in: `dev` (a developer machine
 *          through `stackra dev`) and `test` (a test run). Every other name (`preview`, `staging`, `production`, or
 *          one a product adds) is a deployed target, where the server refuses its writing tools.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode; deploys and other writes only behind approval); ADR 0296 (the
 *                     runway environments); STA-2873.
 */

/** The environment names that are not a deployed target. */
export const LOCAL_ENVIRONMENTS: readonly string[] = ["dev", "test"];
