/**
 * Stackra file contract:
 * Purpose: the web `CellColorPicker` compound on HeroUI Pro's CellColorPicker (a colour picker styled as a settings
 *          cell): the root, the `variant`, `value` and `onChange` are HeroUI Pro's own; the trigger maps `label` to
 *          `aria-label`.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `CellColorPicker.Root` is left out. Imports the `cell-color-picker` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  CellColorPicker as HeroCellColorPicker,
  type CellColorPickerProps as HeroCellColorPickerProps,
} from "@heroui-pro/react/cell-color-picker";

import { CellColorPickerTrigger } from "#react/cell-color-picker/cell-color-picker-trigger";

/** Props of the web CellColorPicker: HeroUI Pro's own, which has no prop the Stackra vocabulary renames. */
export type CellColorPickerProps = HeroCellColorPickerProps;

/** The root: HeroUI Pro's, which holds the colour state and draws no element of its own. */
function CellColorPickerRoot(props: CellColorPickerProps) {
  return <HeroCellColorPicker.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface CellColorPickerParts {
  /** The button that holds the label, the value text and the swatch; named by `label`. */
  readonly Trigger: typeof CellColorPickerTrigger;
  /** The visible label of the cell. */
  readonly Label: typeof HeroCellColorPicker.Label;
  /** The colour as text, for example its hex value. */
  readonly ValueDisplay: typeof HeroCellColorPicker.ValueDisplay;
  /** The swatch that shows the current colour. */
  readonly Swatch: typeof HeroCellColorPicker.Swatch;
  /** The popover that holds the colour area and sliders. */
  readonly Popover: typeof HeroCellColorPicker.Popover;
}

/**
 * A colour picker styled as a settings cell: `CellColorPicker.Trigger` holds `CellColorPicker.Label`,
 * `CellColorPicker.ValueDisplay` and `CellColorPicker.Swatch`, and `CellColorPicker.Popover` holds the colour controls.
 */
export const CellColorPicker: typeof CellColorPickerRoot & CellColorPickerParts = Object.assign(
  CellColorPickerRoot,
  {
    Trigger: CellColorPickerTrigger,
    Label: HeroCellColorPicker.Label,
    ValueDisplay: HeroCellColorPicker.ValueDisplay,
    Swatch: HeroCellColorPicker.Swatch,
    Popover: HeroCellColorPicker.Popover,
  },
);
