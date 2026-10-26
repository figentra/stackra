/**
 * Stackra file contract:
 * Purpose: `CellSwitchProps`, props of the web CellSwitch: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { CellSwitchProps as HeroCellSwitchProps } from "@heroui-pro/react/cell-switch";

import type { CellSwitchContractProps } from "#contracts/types/cell-switch-contract-props.type";

/** Props of the web CellSwitch: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type CellSwitchProps = CellSwitchContractProps &
  Omit<HeroCellSwitchProps, keyof CellSwitchContractProps | "aria-label">;
