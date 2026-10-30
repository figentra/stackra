/**
 * Stackra file contract:
 * Purpose: `CategoryShelfProps`: props of `CategoryShelf`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec (2026-10-27) section 3.3.
 */
import type { ComponentCategory, ComponentEntry } from "@stackra/showcase";
import type { ReactNode } from "react";

/** Props of {@link CategoryShelf}. */
export interface CategoryShelfProps {
  /** The category the shelf shows. */
  readonly category: ComponentCategory;
  /** The entries it lists, in order. */
  readonly entries: readonly ComponentEntry[];
  /** Called with the entry whose card was pressed. */
  readonly onOpen: (entry: ComponentEntry) => void;
  /** Called with the category on "View all". */
  readonly onOpenCategory: (category: ComponentCategory) => void;
  /** The live thumbnail of an entry, when it has a native demo. */
  readonly previewOf?: ((entry: ComponentEntry) => ReactNode) | undefined;
}
