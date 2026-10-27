/**
 * Stackra file contract:
 * Purpose: `QuantityRounding`, how `Quantity.roundTo` and `Quantity.priceMinor` round: `half_up` (half away from zero),
 *          `down` (toward zero) or `up` (away from zero).
 * Boundary: a type only. Which mode a Market or a scale uses is a setting or market-pack value the caller passes.
 *           The codes are a subset of the one rounding vocabulary, `@stackra/contracts`' `Rounding` (support stays
 *           dependency-free, so the subset is spelled here and pinned by a type test in `@stackra/money`).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-934; STA-1383 (one rounding vocabulary).
 */

/** A rounding mode. */
export type QuantityRounding = "half_up" | "down" | "up";
