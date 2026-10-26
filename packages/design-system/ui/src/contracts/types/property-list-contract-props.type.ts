/**
 * Stackra file contract:
 * Purpose: the props every runtime's `PropertyList` takes: the label and value rows of a detail page, in one or two
 *          columns, with the text shown for an empty value and the hooks for copying a value. Each runtime's
 *          `PropertyListProps` is this plus its own element's props, which pass through unchanged.
 * Boundary: types only. The list sorts nothing: the rows are drawn in the order of `items`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); WCAG 2.2 SC 1.3.1.
 */
import type { ReactNode } from "react";

import type { PropertyListItem } from "#contracts/types/property-list-item.type";

/** Props shared by the web and native `PropertyList`. */
export interface PropertyListContractProps<TItem extends PropertyListItem = PropertyListItem> {
  /** The rows, in order. */
  readonly items: readonly TItem[];
  /** How many columns of rows to draw. Defaults to 1; on a narrow screen two columns stack into one. */
  readonly columns?: 1 | 2 | undefined;
  /** What shows in place of an empty value. Defaults to an en dash; pass words ("Not set") when a dash would not say enough. */
  readonly emptyValue?: ReactNode;
  /** Spoken, and on web also drawn as a check, after a value is copied, for example "Copied". Defaults to the `ui` catalogue's word in the active locale, so a copy is never silent. */
  readonly copiedLabel?: string | undefined;
  /**
   * Called with the row and its text once the text is on the clipboard. On web the list writes the clipboard itself; on
   * native it has no clipboard module, so the app writes it here and a row has a copy button only when this is given.
   */
  readonly onCopy?: ((item: TItem, text: string) => void) | undefined;
}
