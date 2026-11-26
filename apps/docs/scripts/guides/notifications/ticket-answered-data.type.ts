/**
 * Stackra file contract:
 * Purpose: `TicketAnsweredData`, what the "Notifications" guide's answer notification reads once per event and every
 *          channel renders: the ticket's id and subject.
 * Boundary: a type only; `TicketAnsweredNotification.data` builds it and the mail body receives it as its props.
 * Runtime: isomorphic
 * Governing contract: ADR 0086; ADR 0223 as amended by ADR 0294; STA-2852.
 */

/** What the answer mail shows. */
export interface TicketAnsweredData {
  /** The ticket's public id, for the link. */
  readonly ticketId: string;

  /** What the customer asked about. */
  readonly subject: string;
}
