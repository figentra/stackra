/**
 * Stackra file contract:
 * Purpose: `SidebarMobileProps`, props of the mobile sidebar: the shared contract plus HeroUI Pro's own.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import type { SidebarMobileProps as HeroSidebarMobileProps } from "@heroui-pro/react/sidebar";

import type { SidebarMobileContractProps } from "#contracts/types/sidebar-mobile-contract-props.type";

/** Props of the mobile sidebar: the shared contract plus HeroUI Pro's own. */
export type SidebarMobileProps = SidebarMobileContractProps &
  Omit<HeroSidebarMobileProps, keyof SidebarMobileContractProps>;
