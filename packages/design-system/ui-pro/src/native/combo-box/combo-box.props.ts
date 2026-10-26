/**
 * Stackra file contract:
 * Purpose: `ComboBoxProps`, props of the native ComboBox: the shared contract plus HeroUI Native Pro's own, passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import type {
  ComboBox as HeroComboBox,
  ComboBoxRootProps as HeroComboBoxRootProps,
  ComboBoxSelectionMode,
} from "heroui-native-pro/combo-box";
import type { ComponentProps } from "react";

import type { ComboBoxContractProps } from "#contracts/types/combo-box-contract-props.type";

/**
 * Props of the native ComboBox: the shared contract plus HeroUI Native Pro's own, passed through unchanged. The
 * accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type ComboBoxProps<M extends ComboBoxSelectionMode = "single"> = ComboBoxContractProps &
  Omit<
    HeroComboBoxRootProps<M>,
    keyof ComboBoxContractProps | "accessibilityLabel" | "aria-label"
  > & { readonly ref?: ComponentProps<typeof HeroComboBox>["ref"] };
