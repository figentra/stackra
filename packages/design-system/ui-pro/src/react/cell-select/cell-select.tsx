/**
 * Stackra file contract:
 * Purpose: the web `CellSelect` compound on HeroUI Pro's CellSelect (a select styled as a settings cell): the root
 *          maps `label` to `aria-label`; the `variant`, `value`, `onChange` and every other prop pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `CellSelect.Root` is left out. Imports the `cell-select` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  CellSelect as HeroCellSelect,
  type CellSelectProps as HeroCellSelectProps,
} from "@heroui-pro/react/cell-select";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { CellSelectProps } from "#react/cell-select/cell-select.props";

/** The root: HeroUI Pro's, with `label` as the accessible name. */
function CellSelectRoot<T extends object = object, M extends "single" | "multiple" = "single">({
  label,
  isDisabled,
  ...rest
}: CellSelectProps<T, M>) {
  return (
    <HeroCellSelect.Root<T, M>
      {...(rest as HeroCellSelectProps<T, M>)}
      {...omitUndefined({ isDisabled, "aria-label": label })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface CellSelectParts {
  /** The pressable row that holds the label, the value and the indicator. */
  readonly Trigger: typeof HeroCellSelect.Trigger;
  /** The visible label of the cell. */
  readonly Label: typeof HeroCellSelect.Label;
  /** The text of the selected item, or the placeholder. */
  readonly Value: typeof HeroCellSelect.Value;
  /** The chevron that shows the popover opens. */
  readonly Indicator: typeof HeroCellSelect.Indicator;
  /** The popover that holds the list box. */
  readonly Popover: typeof HeroCellSelect.Popover;
}

/**
 * A select styled as a settings cell: `CellSelect.Trigger` holds `CellSelect.Label`, `CellSelect.Value` and
 * `CellSelect.Indicator`, and `CellSelect.Popover` holds the list box. Name it for screen readers with `label`.
 */
export const CellSelect: typeof CellSelectRoot & CellSelectParts = Object.assign(CellSelectRoot, {
  Trigger: HeroCellSelect.Trigger,
  Label: HeroCellSelect.Label,
  Value: HeroCellSelect.Value,
  Indicator: HeroCellSelect.Indicator,
  Popover: HeroCellSelect.Popover,
});
