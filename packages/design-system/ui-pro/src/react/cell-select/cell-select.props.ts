/**
 * Stackra file contract:
 * Purpose: `CellSelectProps`, props of the web CellSelect: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { CellSelectProps as HeroCellSelectProps } from "@heroui-pro/react/cell-select";

import type { CellSelectContractProps } from "#contracts/types/cell-select-contract-props.type";

/** Props of the web CellSelect: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type CellSelectProps<
  T extends object = object,
  M extends "single" | "multiple" = "single",
> = CellSelectContractProps &
  Omit<HeroCellSelectProps<T, M>, keyof CellSelectContractProps | "aria-label">;
