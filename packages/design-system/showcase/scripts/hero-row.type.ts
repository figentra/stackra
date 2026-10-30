/**
 * Stackra file contract:
 * Purpose: `HeroRow`, one row of a vendored HeroUI API table (prop, type, default, description).
 * Boundary: a type only, in its own file (ADR 0305).
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */

/** One row of a vendored HeroUI table. */
export interface HeroRow {
  readonly name: string;
  readonly type: string;
  readonly default?: string;
  readonly description: string;
}
