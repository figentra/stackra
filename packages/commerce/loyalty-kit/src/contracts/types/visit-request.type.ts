/**
 * Stackra file contract:
 * Purpose: `VisitRequest`, what a host hands `AccountService.earnVisit` for a stamp card: the visit the stamps are for
 *          and how many stamps it earns.
 * Boundary: a type in the leaf entry. The stamp count comes from the settings (`stampsPerVisit`) or the host's earn rule
 *           set, never from code; the reference makes the stamp idempotent per visit.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 8 and 15); the PUT-133 and COM-183 answers (earning by visit count).
 */

/**
 * One visit to stamp.
 *
 * @example
 * await accounts.earnVisit(memberId(event.clientId), { reference: event.appointmentId, stamps: 1 });
 */
export interface VisitRequest {
  /** What caused the stamps (an appointment, an order); a repeated reference stamps nothing twice. */
  readonly reference: string;

  /** Stamps the visit earns: a positive whole number. */
  readonly stamps: number;
}
