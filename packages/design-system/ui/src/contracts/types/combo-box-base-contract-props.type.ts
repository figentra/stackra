/**
 * Stackra file contract:
 * Purpose: `ComboBoxBaseContractProps`: the props of a ComboBox in either mode.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3: one API on web and
 *          native); ADR 0303 (decision 7, props vocabulary); ADR 0055 (forms: one field contract); ADR 0165 (UI
 *          contract).
 */
import type { ReactNode } from "react";
import type { SelectItem } from "#contracts/types/select-item.type";

/** The props of a ComboBox in either mode. */
export interface ComboBoxBaseContractProps {
  /** The choices that match the text; with `isServerFiltered` the app narrows them as the text changes. */
  readonly items: readonly SelectItem[];
  /** Text shown while the field is empty; it hints at what to pick and never replaces the label. */
  readonly placeholder?: string | undefined;
  /** True to fill the width of the parent instead of the width of the content. */
  readonly isFullWidth?: boolean | undefined;
  /** The text typed to filter the list, for a controlled search box; pair it with `onInputChange`. */
  readonly inputValue?: string | undefined;
  /** Called with the text each time the user types, which is where an async ComboBox starts its search. */
  readonly onInputChange?: ((text: string) => void) | undefined;
  /** True when the app has already narrowed `items` to the text, so the field shows them all and filters nothing. */
  readonly isServerFiltered?: boolean | undefined;
  /** True while items load: a spinner shows under the list. */
  readonly isLoading?: boolean | undefined;
  /** The spoken name of the spinner while items load, for example "Loading more countries"; without it the spinner is silent. */
  readonly loadingLabel?: string | undefined;
  /** Called when the user scrolls to the end of the list, to fetch the next page of choices. */
  readonly onLoadMore?: (() => void) | undefined;
  /** What the list says when no choice matches, for example "No results"; without it the list stays closed. */
  readonly emptyMessage?: ReactNode;
}
