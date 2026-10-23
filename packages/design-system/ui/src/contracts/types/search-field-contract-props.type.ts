/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SearchField` takes: the field contract over a string (label, description, error
 *          message, states, value and change handler) plus the placeholder, the two surfaces, full width, the loading
 *          state, the spoken name of the clear button and the submit and clear handlers. Each runtime's
 *          `SearchFieldProps` is this plus its HeroUI search field's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms: one field contract); ADR 0165 (UI contract).
 */
import type { Variant } from "#contracts/enums/variant.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `SearchField`. */
export interface SearchFieldContractProps extends FieldContractProps<string> {
  /** Text shown while the field is empty; it hints at what to search for and never replaces the label. */
  readonly placeholder?: string | undefined;
  /** The surface of the field: `primary` is the field colour, `secondary` the tinted one for use on a card. */
  readonly variant?: Exclude<Variant, "tertiary"> | undefined;
  /** True to fill the width of the parent instead of the width of the content. */
  readonly isFullWidth?: boolean | undefined;
  /** True while a search runs: a spinner takes the place of the search icon and the field reports itself busy. */
  readonly isLoading?: boolean | undefined;
  /** The spoken name of the clear button, for example "Clear the order search". Defaults to "Clear search". */
  readonly clearLabel?: string | undefined;
  /** Called with the text when the user submits it: Enter on web, the keyboard's search key on native. */
  readonly onSubmit?: ((value: string) => void) | undefined;
  /** Called after the user clears the text with the clear button. */
  readonly onClear?: (() => void) | undefined;
}
