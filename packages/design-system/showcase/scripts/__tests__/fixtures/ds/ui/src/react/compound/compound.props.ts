/**
 * Stackra file contract:
 * Purpose: gen-api test fixture: the root part of a compound component.
 * Boundary: test data only.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */

/** Props of the fixture compound root. */
export interface CompoundProps {
  /** The heading. */
  readonly title: string;
}
