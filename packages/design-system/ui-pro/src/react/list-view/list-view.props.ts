/**
 * Stackra file contract:
 * Purpose: `ListViewProps`, props of the web ListView: the shared contract plus HeroUI Pro's own list props, with
 *          `aria-label` renamed `label` and `virtualized` renamed `isVirtualized`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { ListViewRootProps } from "@heroui-pro/react/list-view";

import type { ListViewContractProps } from "#contracts/types/list-view-contract-props.type";

/**
 * Props of the web ListView: the shared contract plus HeroUI Pro's own list props, with `aria-label` renamed `label`
 * and `virtualized` renamed `isVirtualized`.
 */
export type ListViewProps<T extends object> = ListViewContractProps &
  Omit<ListViewRootProps<T>, keyof ListViewContractProps | "aria-label" | "virtualized">;
