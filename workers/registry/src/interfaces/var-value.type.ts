/**
 * Stackra file contract:
 * Purpose: `VarValue`: A Worker var: wrangler passes a JSON number as a number and a string as a string.
 * Boundary: types only; `readSettings` parses the vars.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 3, 9, 19); ADR 0173 (secrets).
 */

/** A Worker var: wrangler passes a JSON number as a number and a string as a string. */
export type VarValue = string | number | undefined;
