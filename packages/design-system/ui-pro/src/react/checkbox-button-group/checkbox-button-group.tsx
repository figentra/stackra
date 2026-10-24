/**
 * Stackra file contract:
 * Purpose: the web `CheckboxButtonGroup` compound on HeroUI Pro's CheckboxButtonGroup (a multi-selection group of
 *          card-style checkboxes): the root maps `label` to `aria-label`; `layout`, `value`, `onChange` and every other
 *          prop pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `CheckboxButtonGroup.Root` is left out. Imports the `checkbox-button-group`
 *          subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  CheckboxButtonGroup as HeroCheckboxButtonGroup,
  type CheckboxButtonGroupProps as HeroCheckboxButtonGroupProps,
} from "@heroui-pro/react/checkbox-button-group";

import type { CheckboxButtonGroupContractProps } from "#contracts/types/checkbox-button-group-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web CheckboxButtonGroup: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type CheckboxButtonGroupProps = CheckboxButtonGroupContractProps &
  Omit<HeroCheckboxButtonGroupProps, keyof CheckboxButtonGroupContractProps | "aria-label">;

/** The root: HeroUI Pro's, with `label` as the accessible name. */
function CheckboxButtonGroupRoot({ label, isDisabled, ...rest }: CheckboxButtonGroupProps) {
  return (
    <HeroCheckboxButtonGroup.Root
      {...rest}
      {...omitUndefined({ isDisabled, "aria-label": label })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface CheckboxButtonGroupParts {
  /** One checkbox button; takes a `value`. */
  readonly Item: typeof HeroCheckboxButtonGroup.Item;
  /** The check mark of an item. */
  readonly Indicator: typeof HeroCheckboxButtonGroup.Indicator;
  /** The wrapper of an item's label and description. */
  readonly ItemContent: typeof HeroCheckboxButtonGroup.ItemContent;
  /** An icon drawn in an item. */
  readonly ItemIcon: typeof HeroCheckboxButtonGroup.ItemIcon;
}

/**
 * A multi-selection group of card-style checkboxes: each `CheckboxButtonGroup.Item` holds an `Indicator` and an
 * `ItemContent`. Name the group for screen readers with `label`.
 */
export const CheckboxButtonGroup: typeof CheckboxButtonGroupRoot & CheckboxButtonGroupParts =
  Object.assign(CheckboxButtonGroupRoot, {
    Item: HeroCheckboxButtonGroup.Item,
    Indicator: HeroCheckboxButtonGroup.Indicator,
    ItemContent: HeroCheckboxButtonGroup.ItemContent,
    ItemIcon: HeroCheckboxButtonGroup.ItemIcon,
  });
