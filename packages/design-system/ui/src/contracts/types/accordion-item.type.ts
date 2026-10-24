/**
 * Stackra file contract:
 * Purpose: one section of an Accordion: its key, the title on its button, the content it reveals and whether it can be
 *          used. The list of them is the `items` prop, so both runtimes draw the same sections from the same data.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0313.
 */
import type { ReactNode } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";

/** One section of an Accordion. */
export interface AccordionItem extends CollectionItem {
  /** What the section's button says; it is the button's accessible name. */
  readonly title: ReactNode;
  /** What the section reveals while it is expanded. */
  readonly content: ReactNode;
  /** True to show the section but refuse expanding or collapsing it. */
  readonly isDisabled?: boolean | undefined;
}
