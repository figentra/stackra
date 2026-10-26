/**
 * Stackra file contract:
 * Purpose: `IcalStatus`, the RFC 5545 `STATUS` of one event in a written feed: tentative, confirmed or cancelled.
 * Boundary: an `Enum.of` value plus the type of the same name. Codes are snake_case; `icalFeed` writes them upper-case.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.8.1.11; ADR 0294 (decision 16: Enum); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The status of one feed event. */
export const IcalStatus = Enum.of({
  /** Held but not final (a booking waiting for its deposit). */
  Tentative: "tentative",
  /** Final. */
  Confirmed: "confirmed",
  /** Called off; kept in the feed so subscribers drop it. */
  Cancelled: "cancelled",
});

/** One of the codes above. */
export type IcalStatus = Enum.Value<typeof IcalStatus>;
