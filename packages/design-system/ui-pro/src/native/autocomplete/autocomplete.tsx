/**
 * Stackra file contract:
 * Purpose: the native `Autocomplete` compound on HeroUI Native Pro's Autocomplete (a select with a search field in its
 *          overlay): the root maps `label` to `accessibilityLabel`; `value`, `onValueChange`, `filter`, `selectionMode`
 *          and every other prop pass through.
 * Boundary: no behaviour or styling of its own. The compound exposes HeroUI Native Pro's own parts, and its
 *          `useAutocomplete` hook is re-exported as it is; `Label`, `Description` and `FieldError` come from
 *          `heroui-native`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import {
  Autocomplete as HeroAutocomplete,
  type AutocompleteRootProps as HeroAutocompleteRootProps,
  type AutocompleteSelectionMode,
} from "heroui-native-pro/autocomplete";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { AutocompleteProps } from "#native/autocomplete/autocomplete.props";

export { useAutocomplete } from "heroui-native-pro/autocomplete";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function AutocompleteRoot<M extends AutocompleteSelectionMode = "single">({
  label,
  isDisabled,
  ...rest
}: AutocompleteProps<M>): ReactElement {
  return (
    <HeroAutocomplete
      {...(rest as HeroAutocompleteRootProps<M>)}
      {...omitUndefined({ isDisabled, accessibilityLabel: label })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface AutocompleteParts {
  /** The pressable field that shows the value and opens the overlay. */
  readonly Trigger: typeof HeroAutocomplete.Trigger;
  /** The text of the selected option, or the placeholder. */
  readonly Value: typeof HeroAutocomplete.Value;
  /** The chevron drawn in the trigger. */
  readonly TriggerIndicator: typeof HeroAutocomplete.TriggerIndicator;
  /** The button that clears the selection. */
  readonly ClearButton: typeof HeroAutocomplete.ClearButton;
  /** The portal that mounts the overlay above the screen. */
  readonly Portal: typeof HeroAutocomplete.Portal;
  /** The dimmed layer behind the content. */
  readonly Overlay: typeof HeroAutocomplete.Overlay;
  /** The popover or sheet that holds the search field and the list. */
  readonly Content: typeof HeroAutocomplete.Content;
  /** The surface behind the content. */
  readonly ContentBackground: typeof HeroAutocomplete.ContentBackground;
  /** The search field that filters the items. */
  readonly SearchField: typeof HeroAutocomplete.SearchField;
  /** The scrollable list of items. */
  readonly List: typeof HeroAutocomplete.List;
  /** One option of the list. */
  readonly Item: typeof HeroAutocomplete.Item;
  /** The text of an item. */
  readonly ItemLabel: typeof HeroAutocomplete.ItemLabel;
  /** The secondary text of an item. */
  readonly ItemDescription: typeof HeroAutocomplete.ItemDescription;
  /** The mark that shows an item is selected. */
  readonly ItemIndicator: typeof HeroAutocomplete.ItemIndicator;
  /** The heading of the list. */
  readonly ListLabel: typeof HeroAutocomplete.ListLabel;
  /** What the list shows when no item matches the search. */
  readonly Empty: typeof HeroAutocomplete.Empty;
  /** The button that closes the overlay. */
  readonly Close: typeof HeroAutocomplete.Close;
}

/**
 * A select with a search field in its overlay: `Autocomplete.Trigger` opens `Autocomplete.Portal`, which holds
 * `Autocomplete.Overlay` and `Autocomplete.Content` with its `SearchField` and `List`. Name it for screen readers with
 * `label`.
 */
export const Autocomplete: typeof AutocompleteRoot & AutocompleteParts = Object.assign(
  AutocompleteRoot,
  {
    Trigger: HeroAutocomplete.Trigger,
    Value: HeroAutocomplete.Value,
    TriggerIndicator: HeroAutocomplete.TriggerIndicator,
    ClearButton: HeroAutocomplete.ClearButton,
    Portal: HeroAutocomplete.Portal,
    Overlay: HeroAutocomplete.Overlay,
    Content: HeroAutocomplete.Content,
    ContentBackground: HeroAutocomplete.ContentBackground,
    SearchField: HeroAutocomplete.SearchField,
    List: HeroAutocomplete.List,
    Item: HeroAutocomplete.Item,
    ItemLabel: HeroAutocomplete.ItemLabel,
    ItemDescription: HeroAutocomplete.ItemDescription,
    ItemIndicator: HeroAutocomplete.ItemIndicator,
    ListLabel: HeroAutocomplete.ListLabel,
    Empty: HeroAutocomplete.Empty,
    Close: HeroAutocomplete.Close,
  },
);
