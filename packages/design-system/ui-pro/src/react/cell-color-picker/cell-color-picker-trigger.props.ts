/**
 * Stackra file contract:
 * Purpose: `CellColorPickerTriggerProps`, props of the colour picker trigger: the shared contract plus HeroUI Pro's
 *          own, with `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { CellColorPickerTriggerProps as HeroCellColorPickerTriggerProps } from "@heroui-pro/react/cell-color-picker";

import type { CellColorPickerTriggerContractProps } from "#contracts/types/cell-color-picker-contract-props.type";

/** Props of the colour picker trigger: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type CellColorPickerTriggerProps = CellColorPickerTriggerContractProps &
  Omit<HeroCellColorPickerTriggerProps, keyof CellColorPickerTriggerContractProps | "aria-label">;
