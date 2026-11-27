/**
 * Stackra file contract:
 * Purpose: `ENVIRONMENT_VARIABLE`, the name of the runtime variable that holds the running environment
 *          (`STACKRA_ENVIRONMENT`), which `readEnvironment` reads.
 * Boundary: a name only. The variable is read from the runtime environment (`process.env`, a Worker's bindings), never
 *           from the values layer (ADR 0296 amendment 2026-11-26).
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (amendment 2026-11-26); STA-2844.
 */

/** The variable that names the running environment. */
export const ENVIRONMENT_VARIABLE = "STACKRA_ENVIRONMENT";
