/**
 * Stackra file contract:
 * Purpose: `DocPagerProps`: props of `DocPager`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ComponentEntry } from "@stackra/showcase";

/** Props of {@link DocPager}. */
export interface DocPagerProps {
  /** The entry on screen. */
  readonly entry: ComponentEntry;
  /** Called with the previous or next entry of the category to show in place. */
  readonly onOpen: (entry: ComponentEntry) => void;
}
