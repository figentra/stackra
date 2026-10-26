/**
 * Stackra file contract:
 * Purpose: the web `CellSwitch` compound on HeroUI Pro's CellSwitch (a toggle styled as a settings cell): the root
 *          maps `label` to `aria-label`; the `variant` and every other prop pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `CellSwitch.Root` is left out. Imports the `cell-switch` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import { CellSwitch as HeroCellSwitch } from "@heroui-pro/react/cell-switch";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { CellSwitchProps } from "#react/cell-switch/cell-switch.props";

/** The root: HeroUI Pro's, with `label` as the accessible name. */
function CellSwitchRoot({ label, isDisabled, ...rest }: CellSwitchProps) {
  return <HeroCellSwitch.Root {...rest} {...omitUndefined({ isDisabled, "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface CellSwitchParts {
  /** The pressable row that holds the label and the control. */
  readonly Trigger: typeof HeroCellSwitch.Trigger;
  /** The visible label inside the trigger. */
  readonly Label: typeof HeroCellSwitch.Label;
  /** The switch track and thumb. */
  readonly Control: typeof HeroCellSwitch.Control;
}

/**
 * A toggle styled as a settings cell: `CellSwitch.Trigger` holds `CellSwitch.Label` and `CellSwitch.Control`. Name it
 * for screen readers with `label`.
 */
export const CellSwitch: typeof CellSwitchRoot & CellSwitchParts = Object.assign(CellSwitchRoot, {
  Trigger: HeroCellSwitch.Trigger,
  Label: HeroCellSwitch.Label,
  Control: HeroCellSwitch.Control,
});
