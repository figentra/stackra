/**
 * Stackra file contract:
 * Purpose: `AutocompleteProps`, the props of the web `Autocomplete` in `autocomplete.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          v3 on web); ADR 0055 (one field contract); owner decision 6 of STA-350 (thin wrappers); STA-1981.
 */
import type { AutocompleteRootProps } from "@heroui/react";

import type { SelectItem } from "#contracts/types/select-item.type";
import type { SingleComboBoxContractProps } from "#contracts/types/single-combo-box-contract-props.type";

/**
 * Props of the web Autocomplete: the single ComboBox contract (one key, `null` for none) plus its own words and HeroUI
 * v3's autocomplete props, passed through unchanged. HeroUI's `fullWidth` is `isFullWidth`; the app lists choices as
 * `items`, never as children.
 */
export type AutocompleteProps = Omit<SingleComboBoxContractProps, "selectionMode"> &
  Omit<
    AutocompleteRootProps<SelectItem, "single">,
    keyof SingleComboBoxContractProps | "children" | "items" | "fullWidth"
  > & {
    /** The words of the search box in the list and of the clear button; each defaults to the package's own. */
    readonly labels?:
      | {
          /** The search box's spoken name and placeholder, for example "Search countries". */
          readonly search?: string | undefined;
          /** The clear button's spoken name, for example "Clear selection". */
          readonly clear?: string | undefined;
        }
      | undefined;
  };
