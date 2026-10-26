/**
 * Stackra file contract:
 * Purpose: `PackCalendarRef`, the stored pointer from a record (a store, a branch, a court) to the market-pack calendar
 *          it works to: the market code whose pack's `calendar.*` keys answer, and the location's own time zone. The
 *          reader resolves the pack and calls `calendarFromPack` with it.
 * Boundary: a type only, plain JSON. It names data and holds none: the working week, holidays and uncertain-day rule
 *           stay in the pack; local closures and hours go in `PackCalendarOptions` at the call.
 * Runtime: isomorphic
 * Governing contract: ADR 0387 (calendar from packs); ADR 0370 (decision 3: markets and overlays).
 */

/** Which pack calendar a record uses. */
export interface PackCalendarRef {
  /** The market code whose resolved pack holds the calendar (`sa`, `ae-dxb`, `us-ny`). */
  readonly market: string;

  /** The location's IANA time zone; null keeps the pack's `calendar.time_zone`. */
  readonly timeZone: string | null;
}
