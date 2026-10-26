/**
 * Stackra file contract:
 * Purpose: `AutocompleteProps`, props of the native Autocomplete: the shared contract plus HeroUI Native Pro's own,
 *          passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import type {
  Autocomplete as HeroAutocomplete,
  AutocompleteRootProps as HeroAutocompleteRootProps,
  AutocompleteSelectionMode,
} from "heroui-native-pro/autocomplete";
import type { ComponentProps } from "react";

import type { AutocompleteContractProps } from "#contracts/types/autocomplete-contract-props.type";

/**
 * Props of the native Autocomplete: the shared contract plus HeroUI Native Pro's own, passed through unchanged. The
 * accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type AutocompleteProps<M extends AutocompleteSelectionMode = "single"> =
  AutocompleteContractProps &
    Omit<
      HeroAutocompleteRootProps<M>,
      keyof AutocompleteContractProps | "accessibilityLabel" | "aria-label"
    > & { readonly ref?: ComponentProps<typeof HeroAutocomplete>["ref"] };
