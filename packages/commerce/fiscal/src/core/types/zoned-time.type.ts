/**
 * Stackra file contract:
 * Purpose: `ZonedTime`, an instant as a market's wall clock shows it: local date, local time and UTC offset.
 * Boundary: a type only; `zonedTime` builds it from an IANA zone named in pack options.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */

/** Local date and time in one zone. */
export type ZonedTime = {
  /** `YYYY-MM-DD`. */
  readonly date: string;
  /** `HH:mm:ss`, 24-hour. */
  readonly time: string;
  /** `+HH:MM` or `-HH:MM`. */
  readonly offset: string;
};
