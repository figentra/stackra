/**
 * Stackra file contract:
 * Purpose: `ContextMenuMenuProps`, props of `ContextMenu.Menu`: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { ContextMenuMenuProps as HeroContextMenuMenuProps } from "@heroui-pro/react/context-menu";

import type { ContextMenuMenuContractProps } from "#contracts/types/context-menu-menu-contract-props.type";

/** Props of `ContextMenu.Menu`: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type ContextMenuMenuProps<T extends object = object> = ContextMenuMenuContractProps &
  Omit<HeroContextMenuMenuProps<T>, keyof ContextMenuMenuContractProps | "aria-label">;
