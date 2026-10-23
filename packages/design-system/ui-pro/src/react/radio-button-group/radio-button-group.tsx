/**
 * Stackra file contract:
 * Purpose: the web `RadioButtonGroup` compound on HeroUI Pro's RadioButtonGroup (a single-selection group of
 *          card-style radios): the root maps `label` to `aria-label`; `layout`, `value`, `onChange` and every other
 *          prop pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `RadioButtonGroup.Root` is left out. Imports the `radio-button-group`
 *          subpath. The native `RadioButtonGroup` shares its contract.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  RadioButtonGroup as HeroRadioButtonGroup,
  type RadioButtonGroupProps as HeroRadioButtonGroupProps,
} from "@heroui-pro/react/radio-button-group";

import type { RadioButtonGroupContractProps } from "#contracts/types/radio-button-group-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web RadioButtonGroup: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type RadioButtonGroupProps = RadioButtonGroupContractProps &
  Omit<HeroRadioButtonGroupProps, keyof RadioButtonGroupContractProps | "aria-label">;

/** The root: HeroUI Pro's, with `label` as the accessible name. */
function RadioButtonGroupRoot({ label, isDisabled, ...rest }: RadioButtonGroupProps) {
  return (
    <HeroRadioButtonGroup.Root {...rest} {...omitUndefined({ isDisabled, "aria-label": label })} />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface RadioButtonGroupParts {
  /** One radio button; takes a `value`. */
  readonly Item: typeof HeroRadioButtonGroup.Item;
  /** The selection mark of an item. */
  readonly Indicator: typeof HeroRadioButtonGroup.Indicator;
  /** The wrapper of an item's label and description. */
  readonly ItemContent: typeof HeroRadioButtonGroup.ItemContent;
  /** An icon drawn in an item. */
  readonly ItemIcon: typeof HeroRadioButtonGroup.ItemIcon;
}

/**
 * A single-selection group of card-style radios: each `RadioButtonGroup.Item` holds an `ItemIcon`, an `ItemContent`
 * and an `Indicator`. Name the group for screen readers with `label`.
 */
export const RadioButtonGroup: typeof RadioButtonGroupRoot & RadioButtonGroupParts = Object.assign(
  RadioButtonGroupRoot,
  {
    Item: HeroRadioButtonGroup.Item,
    Indicator: HeroRadioButtonGroup.Indicator,
    ItemContent: HeroRadioButtonGroup.ItemContent,
    ItemIcon: HeroRadioButtonGroup.ItemIcon,
  },
);
