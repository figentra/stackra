/**
 * Stackra file contract:
 * Purpose: `SidebarProps`, props of the web Sidebar: the shared contract plus HeroUI Pro's own, with `aria-label`
 *          renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import type { SidebarRootProps as HeroSidebarRootProps } from "@heroui-pro/react/sidebar";

import type { SidebarContractProps } from "#contracts/types/sidebar-contract-props.type";

/** Props of the web Sidebar: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type SidebarProps = SidebarContractProps &
  Omit<HeroSidebarRootProps, keyof SidebarContractProps | "aria-label">;
