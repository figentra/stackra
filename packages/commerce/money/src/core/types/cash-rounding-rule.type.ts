/**
 * Stackra file contract:
 * Purpose: `CashRoundingRule`, one row of a market pack's cash rounding table: the smallest cash amount a currency is
 *          paid in at a till (`incrementMinor` 5 for CHF's 0.05) and how a total rounds to it.
 * Boundary: a type only; market-pack data, never a literal in code. A currency with no row is paid to the minor unit.
 *           `CashRounding.of` checks a row. An `optional` row (the US 5-cent rule, US-39) applies only where the tenant
 *           turned cash rounding on; `roundCash` reads the switch.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 3); config-model section 1 (market packs hold the table); owner US-39.
 */
import type { Rounding } from "#core/enums/rounding.enum";

/** How cash totals in one currency round. */
export interface CashRoundingRule {
  /** The ISO 4217 code the rule is for. */
  readonly currency: string;

  /** The smallest cash step in minor units: a positive safe integer. */
  readonly incrementMinor: number;

  /** How a total moves onto a step, as the market's rule says. */
  readonly rounding: Rounding;

  /** When true, the step applies only where the tenant's setting turns it on; absent is false (always applies). */
  readonly optional?: boolean;
}
