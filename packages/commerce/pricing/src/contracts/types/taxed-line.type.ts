/**
 * Stackra file contract:
 * Purpose: `TaxedLine`, the tax on one line as a provider answered it: the amount, the rate and the jurisdiction it
 *          came from.
 * Boundary: a type only. `rate` is a decimal string (`"0.15"`), so a stored quote keeps it exactly.
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decision 9); ADR 0220 (decision 3).
 */
import type { Money } from "@stackra/money";

/** The tax of one line. */
export interface TaxedLine {
  /** The line's id, as asked. */
  readonly id: string;

  /** The tax on the line. */
  readonly tax: Money;

  /** The rate applied, as a decimal fraction (`"0.15"`). */
  readonly rate: string;

  /** The jurisdiction the rate belongs to (`sa`, `us-ny`). */
  readonly jurisdiction: string;
}
