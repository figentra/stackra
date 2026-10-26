/**
 * Stackra file contract:
 * Purpose: `ContextMenuProps`, props of the web ContextMenu: the shared contract plus HeroUI Pro's own, with `open`
 *          renamed `isOpen`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { ContextMenuProps as HeroContextMenuProps } from "@heroui-pro/react/context-menu";

import type { ContextMenuContractProps } from "#contracts/types/context-menu-contract-props.type";

/** Props of the web ContextMenu: the shared contract plus HeroUI Pro's own, with `open` renamed `isOpen`. */
export type ContextMenuProps = ContextMenuContractProps &
  Omit<HeroContextMenuProps, keyof ContextMenuContractProps | "open">;
