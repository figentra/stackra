/**
 * Stackra file contract:
 * Purpose: the native `RadioButtonGroup` compound on HeroUI Native Pro's RadioButtonGroup (a single-selection group of
 *          card-style radios): the root maps `label` to `accessibilityLabel`; `value`, `onValueChange`, `variant` and
 *          every other prop pass through.
 * Boundary: no behaviour or styling of its own. The compound exposes HeroUI Native Pro's own parts, and its two hooks
 *          are re-exported as they are. The web `RadioButtonGroup` shares its contract.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import { RadioButtonGroup as HeroRadioButtonGroup } from "heroui-native-pro/radio-button-group";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { RadioButtonGroupProps } from "#native/radio-button-group/radio-button-group.props";

export { useRadioButtonGroup, useRadioButtonGroupItem } from "heroui-native-pro/radio-button-group";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function RadioButtonGroupRoot({ label, isDisabled, ...rest }: RadioButtonGroupProps): ReactElement {
  return (
    <HeroRadioButtonGroup {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface RadioButtonGroupParts {
  /** One radio button; takes a `value`. */
  readonly Item: typeof HeroRadioButtonGroup.Item;
  /** The surface behind an item. */
  readonly ItemBackground: typeof HeroRadioButtonGroup.ItemBackground;
  /** The wrapper of an item's label and description. */
  readonly ItemContent: typeof HeroRadioButtonGroup.ItemContent;
}

/**
 * A single-selection group of card-style radios: each `RadioButtonGroup.Item` holds an `ItemContent`. Name the group
 * for screen readers with `label`.
 */
export const RadioButtonGroup: typeof RadioButtonGroupRoot & RadioButtonGroupParts = Object.assign(
  RadioButtonGroupRoot,
  {
    Item: HeroRadioButtonGroup.Item,
    ItemBackground: HeroRadioButtonGroup.ItemBackground,
    ItemContent: HeroRadioButtonGroup.ItemContent,
  },
);
