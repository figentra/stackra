/**
 * Stackra file contract:
 * Purpose: `EDGE_DRIVERS`, the driver names of the two edge ports this package ships: `EdgeSigningKeys` (`memory`,
 *          `env`) and `EdgeNonceStore` (`memory`).
 * Boundary: data only; the one list `EDGE_CONFIG_SCHEMA` and the `DriverRegistry` entries read, so they cannot drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 4); ADR 0263 (decision 9).
 */

/** The edge ports' driver names, by port. */
export const EDGE_DRIVERS = Object.freeze({
  keys: ["memory", "env"] as const,
  nonces: ["memory"] as const,
});
