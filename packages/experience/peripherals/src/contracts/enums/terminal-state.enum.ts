/**
 * Stackra file contract:
 * Purpose: `TerminalState`, what a paired card terminal reports: ready for a payment, busy with one, or unreachable.
 * Boundary: an `Enum.of` value plus the type of the same name. A payment itself is the payments driver's protocol;
 *           this is only the pairing's report (ADR 0339 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1: `CardTerminal` pairs and reports); ADR 0294 (decision 16); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** A card terminal's state. */
export const TerminalState = Enum.of({
  /** Paired and idle. */
  Ready: "ready",
  /** Paired and taking a payment. */
  Busy: "busy",
  /** Paired but not answering. */
  Offline: "offline",
});

/** One of the codes above. */
export type TerminalState = Enum.Value<typeof TerminalState>;
