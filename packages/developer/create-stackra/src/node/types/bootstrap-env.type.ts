/**
 * Stackra file contract:
 * Purpose: `BootstrapEnv`, an environment as `process.env` holds it: what `create-stackra` reads `STACKRA_REGISTRY`
 *          and `npm_execpath` from, and what it hands the child.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */

/** An environment, as `process.env` holds it. */
export type BootstrapEnv = Readonly<Record<string, string | undefined>>;
