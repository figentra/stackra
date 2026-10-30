/**
 * Stackra file contract:
 * Purpose: `CarouselContractProps`, the props of every runtime's `Carousel`: slides that snap one view at a time, with
 *          previous and next buttons and page dots.
 * Boundary: types only. Slides run in the reading direction; Arabic starts on the right and "next" points left.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); WCAG 2.2 SC 2.2.2; STA-1371.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `Carousel`. */
export interface CarouselContractProps {
  /** The slides, one element each. */
  readonly children: readonly ReactNode[];
  /** The carousel's accessible name, such as "Featured products". */
  readonly label: string;
  /** Shows the page dots; on by default. */
  readonly showDots?: boolean | undefined;
  /** Shows the previous and next buttons; on by default. */
  readonly showArrows?: boolean | undefined;
  /** Image URLs, one per slide; given, a strip of thumbnails to press replaces the page dots. */
  readonly thumbnails?: readonly string[] | undefined;
  /** Called with the index of the slide in view. */
  readonly onIndexChange?: ((index: number) => void) | undefined;
}
