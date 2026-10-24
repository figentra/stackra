/**
 * Stackra file contract:
 * Purpose: `Sidebar.Menu` on HeroUI Pro's `Sidebar.Menu`: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; expansion, guide lines and items are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import {
  Sidebar as HeroSidebar,
  type SidebarMenuProps as HeroSidebarMenuProps,
} from "@heroui-pro/react/sidebar";

import type { SidebarMenuContractProps } from "#contracts/types/sidebar-contract-props.type";

/** Props of the sidebar menu: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type SidebarMenuProps<T extends object> = SidebarMenuContractProps &
  Omit<HeroSidebarMenuProps<T>, keyof SidebarMenuContractProps | "aria-label">;

/** A navigation menu of items with optional submenus, named for assistive technology by `label`. */
export function SidebarMenu<T extends object>({ label, ...rest }: SidebarMenuProps<T>) {
  return <HeroSidebar.Menu<T> {...rest} aria-label={label} />;
}
