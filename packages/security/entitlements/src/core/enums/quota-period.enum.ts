/**
 * Stackra file contract:
 * Purpose: `QuotaPeriod`, the window a quota entitlement counts its meter over: a UTC calendar day, month or year.
 * Boundary: an `Enum.of` value plus the type of the same name; `quotaWindow` turns one into the window's instants.
 *           The allowance per period is plan data (the grant), never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decisions 2 and 3: windowed meters, quotas); ADR 0231 (snake_case codes); stackra-309.
 */
import { Enum } from "@stackra/contracts";

/**
 * The quota periods.
 *
 * @example
 * Entitlement({ kind: EntitlementKind.Quota, meter: "ai.tokens", per: QuotaPeriod.Month });
 */
export const QuotaPeriod = Enum.of({
  /** The UTC calendar day. */
  Day: "day",
  /** The UTC calendar month. */
  Month: "month",
  /** The UTC calendar year. */
  Year: "year",
});

/** One of the codes above. */
export type QuotaPeriod = Enum.Value<typeof QuotaPeriod>;
