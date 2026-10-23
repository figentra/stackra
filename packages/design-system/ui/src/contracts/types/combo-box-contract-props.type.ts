/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ComboBox` takes: the field contract over the chosen key, or a list of keys in
 *          multiple mode, plus the choices, the placeholder, full width, the typed text with its change handler, the
 *          loading state, the load-more request and the message for no match. Each runtime's `ComboBoxProps` is this plus
 *          its renderer's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms: one field contract); ADR 0165 (UI contract).
 */
import type { ReactNode } from "react";

import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
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

/** A ComboBox that picks one choice: `value` is its key, and `null` means nothing is chosen. */
export interface SingleComboBoxContractProps
  extends ComboBoxBaseContractProps, FieldContractProps<string | null> {
  /** One choice at a time. This is the default. */
  readonly selectionMode?: "single" | undefined;
}

/** A ComboBox that picks several choices: `value` is the list of their keys. */
export interface MultipleComboBoxContractProps
  extends ComboBoxBaseContractProps, FieldContractProps<readonly string[]> {
  /** Several choices at once; the web shows the picked ones as removable tags. */
  readonly selectionMode: "multiple";
}

/** Props shared by the web and native `ComboBox`: the single or the multiple form, told apart by `selectionMode`. */
export type ComboBoxContractProps = SingleComboBoxContractProps | MultipleComboBoxContractProps;
