/**
 * Stackra file contract:
 * Purpose: `GroupCardProps`: props of `GroupCard`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec (2026-10-27) section 5.
 */
import type { ComponentCategory, ComponentEntry } from "@stackra/showcase";
import type { ReactNode } from "react";

/** Props of {@link GroupCard}. */
export interface GroupCardProps {
  /** The category the card opens. */
  readonly category: ComponentCategory;
  /** The category's entries in listing order; the first with a native demo gives the thumbnail. */
  readonly entries: readonly ComponentEntry[];
  /** Called with the category on press. */
  readonly onPress: (category: ComponentCategory) => void;
  /** The live thumbnail of an entry, when it has a native demo. */
  readonly previewOf?: ((entry: ComponentEntry) => ReactNode) | undefined;
}
