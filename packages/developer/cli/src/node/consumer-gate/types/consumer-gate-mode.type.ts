/**
 * Stackra file contract:
 * Purpose: `ConsumerGateMode`, how core reaches the consumer: `link` (`link:` rows to the core tree) or `pack`
 *          (`file:` rows to tarballs of every publishable core package, as a registry install would see them).
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** The run mode. */
export type ConsumerGateMode = "link" | "pack";
