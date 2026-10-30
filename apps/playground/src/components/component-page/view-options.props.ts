/**
 * Stackra file contract:
 * Purpose: `ViewOptionsProps`, props of the page's view options menu: the entry, the platform and the markdown maker.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); showcase redesign spec (2026-10-27) section 4 (row 1).
 */
import type { SectionProps } from "#src/components/component-page/section.props";

/** Props of `ViewOptions`. */
export interface ViewOptionsProps extends SectionProps {
  /** Builds the page's markdown when the reader asks to copy it (the demo sources load then). */
  readonly markdown: () => Promise<string>;
}
