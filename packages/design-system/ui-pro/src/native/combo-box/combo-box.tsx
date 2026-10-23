/**
 * Stackra file contract:
 * Purpose: the native `ComboBox` compound on HeroUI Native Pro's ComboBox (a text input with a filtered option list):
 *          the root maps `label` to `accessibilityLabel`; `value`, `onValueChange`, `menuTrigger`, `filter` and every
 *          other prop pass through.
 * Boundary: no behaviour or styling of its own. The compound exposes HeroUI Native Pro's own parts, and its
 *          `useComboBox` hook is re-exported as it is; `Label`, `Description` and `FieldError` come from
 *          `heroui-native`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import {
  ComboBox as HeroComboBox,
  type ComboBoxRootProps as HeroComboBoxRootProps,
  type ComboBoxSelectionMode,
} from "heroui-native-pro/combo-box";
import type { ComponentProps, ReactElement } from "react";

import type { ComboBoxContractProps } from "#contracts/types/combo-box-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

export { useComboBox } from "heroui-native-pro/combo-box";

/**
 * Props of the native ComboBox: the shared contract plus HeroUI Native Pro's own, passed through unchanged. The
 * accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type ComboBoxProps<M extends ComboBoxSelectionMode = "single"> = ComboBoxContractProps &
  Omit<
    HeroComboBoxRootProps<M>,
    keyof ComboBoxContractProps | "accessibilityLabel" | "aria-label"
  > & { readonly ref?: ComponentProps<typeof HeroComboBox>["ref"] };

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function ComboBoxRoot<M extends ComboBoxSelectionMode = "single">({
  label,
  isDisabled,
  ...rest
}: ComboBoxProps<M>): ReactElement {
  return (
    <HeroComboBox
      {...(rest as HeroComboBoxRootProps<M>)}
      {...omitUndefined({ isDisabled, accessibilityLabel: label })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface ComboBoxParts {
  /** The row that holds the prefix, the input, the suffix and the trigger. */
  readonly InputGroup: typeof HeroComboBox.InputGroup;
  /** The text input the user types into. */
  readonly Input: typeof HeroComboBox.Input;
  /** Content before the input. */
  readonly Prefix: typeof HeroComboBox.Prefix;
  /** Content after the input. */
  readonly Suffix: typeof HeroComboBox.Suffix;
  /** The pressable area that opens the list. */
  readonly Trigger: typeof HeroComboBox.Trigger;
  /** The chevron drawn in the trigger. */
  readonly TriggerIndicator: typeof HeroComboBox.TriggerIndicator;
  /** The button that clears the selection and the input text. */
  readonly ClearButton: typeof HeroComboBox.ClearButton;
  /** The text of the selected option, or the placeholder. */
  readonly Value: typeof HeroComboBox.Value;
  /** The portal that mounts the overlay above the screen. */
  readonly Portal: typeof HeroComboBox.Portal;
  /** The dimmed layer behind the content. */
  readonly Overlay: typeof HeroComboBox.Overlay;
  /** The popover that holds the list. */
  readonly Content: typeof HeroComboBox.Content;
  /** The surface behind the content. */
  readonly ContentBackground: typeof HeroComboBox.ContentBackground;
  /** The scrollable list of items. */
  readonly List: typeof HeroComboBox.List;
  /** The heading of the list. */
  readonly ListLabel: typeof HeroComboBox.ListLabel;
  /** One option of the list. */
  readonly Item: typeof HeroComboBox.Item;
  /** The text of an item. */
  readonly ItemLabel: typeof HeroComboBox.ItemLabel;
  /** The secondary text of an item. */
  readonly ItemDescription: typeof HeroComboBox.ItemDescription;
  /** The mark that shows an item is selected. */
  readonly ItemIndicator: typeof HeroComboBox.ItemIndicator;
  /** What the list shows when no item matches the input. */
  readonly Empty: typeof HeroComboBox.Empty;
}

/**
 * A text input with a filtered option list: `ComboBox.InputGroup` holds `ComboBox.Input`, and `ComboBox.Portal` holds
 * `ComboBox.Overlay` and `ComboBox.Content` with its `List`. Name it for screen readers with `label`.
 */
export const ComboBox: typeof ComboBoxRoot & ComboBoxParts = Object.assign(ComboBoxRoot, {
  InputGroup: HeroComboBox.InputGroup,
  Input: HeroComboBox.Input,
  Prefix: HeroComboBox.Prefix,
  Suffix: HeroComboBox.Suffix,
  Trigger: HeroComboBox.Trigger,
  TriggerIndicator: HeroComboBox.TriggerIndicator,
  ClearButton: HeroComboBox.ClearButton,
  Value: HeroComboBox.Value,
  Portal: HeroComboBox.Portal,
  Overlay: HeroComboBox.Overlay,
  Content: HeroComboBox.Content,
  ContentBackground: HeroComboBox.ContentBackground,
  List: HeroComboBox.List,
  ListLabel: HeroComboBox.ListLabel,
  Item: HeroComboBox.Item,
  ItemLabel: HeroComboBox.ItemLabel,
  ItemDescription: HeroComboBox.ItemDescription,
  ItemIndicator: HeroComboBox.ItemIndicator,
  Empty: HeroComboBox.Empty,
});
