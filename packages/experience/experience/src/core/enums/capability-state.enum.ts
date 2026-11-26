/**
 * Stackra file contract:
 * Purpose: `CapabilityState`, whether a row of a capability matrix offers a column's capability: yes, no, or coming.
 * Boundary: an `Enum.of` value plus the type of the same name; codes are snake_case and never shown as words (the
 *           matrix's `stateLabels` give the words).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0231 (snake_case codes); STA-2041.
 */
import { Enum } from "@stackra/contracts";

/** A capability's state in one cell. */
export const CapabilityState = Enum.of({
  /** Offered today. */
  Yes: "yes",
  /** Not offered. */
  No: "no",
  /** Planned, not offered yet. */
  Coming: "coming",
});

/** One of the codes above. */
export type CapabilityState = Enum.Value<typeof CapabilityState>;
