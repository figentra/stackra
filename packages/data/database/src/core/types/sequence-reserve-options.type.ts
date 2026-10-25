/**
 * Stackra file contract:
 * Purpose: `SequenceReserveOptions`, what `SequenceService.reserve` takes besides the sequence, scope and series: the
 *          device, the block size and the time zone the period's year is read in.
 * Boundary: a type only; the holder is the authenticated device, never request input.
 * Runtime: node
 * Governing contract: ADR 0342 (decision 4); ADR 0338.
 */

/** The reservation request. */
export interface SequenceReserveOptions {
  /** The device the block is for (its public id). */
  readonly holder: string;

  /** How many numbers, at most the declared `reserve.size` (the default). */
  readonly size?: number;

  /** The IANA time zone the year of a yearly sequence is read in; `UTC` by default. */
  readonly timeZone?: string;
}
