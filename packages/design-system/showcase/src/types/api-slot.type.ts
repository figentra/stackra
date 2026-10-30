/**
 * Stackra file contract:
 * Purpose: `ApiSlot`, one styling slot: a react CSS class (BEM) or a native `classNames` key.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.1; ADR 0305 (one declaration per file).
 */

/** One styling slot. */
export interface ApiSlot {
  /** The class name or `classNames` key. */
  readonly name: string;
  /** What the slot styles. */
  readonly description: string;
}
