/**
 * Stackra file contract:
 * Purpose: gen-api test fixture: the `Compound.Item` part, found as the sibling props file.
 * Boundary: test data only.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */

/** Props of the fixture compound item. */
export interface CompoundItemProps {
  /** The item id. */
  readonly id?: string;
}
