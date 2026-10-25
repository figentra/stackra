/**
 * Stackra file contract:
 * Purpose: `Occurrence`, one date of a recurring series as `occurrences` returns it.
 * Boundary: a type only. `uncertain` is `true` when the date may be a holiday nobody has confirmed yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 4 and 6).
 */
import type { IsoDate } from "#core/types/iso-date.type";

/** One occurrence of a series. */
export interface Occurrence {
  /** The local date. */
  readonly date: IsoDate;

  /** The start instant, ISO 8601 in UTC. */
  readonly start: string;

  /** Whether the date may be an unconfirmed holiday. */
  readonly uncertain: boolean;
}
