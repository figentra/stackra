/**
 * Stackra file contract:
 * Purpose: `UncertainDays`, how business-day counts and working hours treat a day whose status is `uncertain`: as a
 *          working day or as closed. It is calendar data (`BusinessCalendar.uncertainDays`), set by the market pack or
 *          the tenant, never a package default.
 * Boundary: an `Enum.of` value plus the type of the same name. Either way the day is still reported as uncertain.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 4); ADR 0363 (decision 1: policy is data).
 */
import { Enum } from "@stackra/contracts";

/** How an uncertain day counts. */
export const UncertainDays = Enum.of({
  /** Counted as a working day. */
  Working: "working",
  /** Counted as closed. */
  Closed: "closed",
});

/** One of the codes above. */
export type UncertainDays = Enum.Value<typeof UncertainDays>;
