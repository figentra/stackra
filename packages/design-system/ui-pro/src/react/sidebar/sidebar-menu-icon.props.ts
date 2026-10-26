/**
 * Stackra file contract:
 * Purpose: `SidebarMenuIconProps`, props of the menu icon: the shared contract plus HeroUI Pro's own.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import type { SidebarMenuIconProps as HeroSidebarMenuIconProps } from "@heroui-pro/react/sidebar";

import type { SidebarMenuIconContractProps } from "#contracts/types/sidebar-menu-icon-contract-props.type";

/** Props of the menu icon: the shared contract plus HeroUI Pro's own. */
export type SidebarMenuIconProps = SidebarMenuIconContractProps &
  Omit<HeroSidebarMenuIconProps, keyof SidebarMenuIconContractProps>;
