/**
 * Stackra file contract:
 * Purpose: `SidebarMenuProps`, props of the sidebar menu: the shared contract plus HeroUI Pro's own, with `aria-label`
 *          renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import type { SidebarMenuProps as HeroSidebarMenuProps } from "@heroui-pro/react/sidebar";

import type { SidebarMenuContractProps } from "#contracts/types/sidebar-menu-contract-props.type";

/** Props of the sidebar menu: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type SidebarMenuProps<T extends object> = SidebarMenuContractProps &
  Omit<HeroSidebarMenuProps<T>, keyof SidebarMenuContractProps | "aria-label">;
