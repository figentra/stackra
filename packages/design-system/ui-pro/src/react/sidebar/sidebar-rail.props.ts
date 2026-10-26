/**
 * Stackra file contract:
 * Purpose: `SidebarRailProps`, props of the sidebar rail: the shared contract plus HeroUI Pro's own, with `aria-label`
 *          renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import type { SidebarRailProps as HeroSidebarRailProps } from "@heroui-pro/react/sidebar";

import type { SidebarRailContractProps } from "#contracts/types/sidebar-rail-contract-props.type";

/** Props of the sidebar rail: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type SidebarRailProps = SidebarRailContractProps &
  Omit<HeroSidebarRailProps, keyof SidebarRailContractProps | "aria-label">;
