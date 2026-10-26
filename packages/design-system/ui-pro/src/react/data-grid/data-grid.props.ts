/**
 * Stackra file contract:
 * Purpose: `DataGridProps`, props of the web DataGrid: the shared contract plus HeroUI Pro's own grid props, passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); owner decision 6 of
 *                     STA-350 (thin wrappers); STA-403 FR-003.
 */
import type { DataGridProps as HeroDataGridProps } from "@heroui-pro/react/data-grid";

import type { DataGridContractProps } from "#contracts/types/data-grid-contract-props.type";

/**
 * Props of the web DataGrid: the shared contract plus HeroUI Pro's own grid props, passed through unchanged.
 * HeroUI Pro's `aria-label` is the contract's `label`, so the type refuses it.
 */
export type DataGridProps<T extends object> = DataGridContractProps &
  Omit<HeroDataGridProps<T>, keyof DataGridContractProps | "aria-label">;
