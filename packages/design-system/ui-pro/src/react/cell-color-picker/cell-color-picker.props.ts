/**
 * Stackra file contract:
 * Purpose: `CellColorPickerProps`, props of the web CellColorPicker: HeroUI Pro's own, which has no prop the Stackra
 *          vocabulary renames.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { CellColorPickerProps as HeroCellColorPickerProps } from "@heroui-pro/react/cell-color-picker";

/** Props of the web CellColorPicker: HeroUI Pro's own, which has no prop the Stackra vocabulary renames. */
export type CellColorPickerProps = HeroCellColorPickerProps;
