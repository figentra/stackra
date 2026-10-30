/**
 * Stackra file contract:
 * Purpose: `SunburstArc`, one laid-out slice of a sunburst chart: its ring, its angles and its colour's position
 *          (`sunburstLayoutOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { SunburstItem } from "#contracts/types/sunburst-item.type";

/** One slice on its ring. */
export interface SunburstArc {
  readonly item: SunburstItem;
  /** 0 for a top slice, 1 for its children, and so on outwards. */
  readonly depth: number;
  /** Radians clockwise from the top. */
  readonly start: number;
  readonly end: number;
  readonly value: number;
  /** The position of its top slice, which picks the colour the whole branch shares. */
  readonly branch: number;
  /** The labels from the top slice down to this one. */
  readonly trail: readonly string[];
  /** The keys from the top slice down to this one, unique per slice. */
  readonly keys: readonly string[];
}
