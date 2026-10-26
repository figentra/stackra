/**
 * Stackra file contract:
 * Purpose: `SidebarTriggerProps`, props of the sidebar trigger: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import type { SidebarTriggerProps as HeroSidebarTriggerProps } from "@heroui-pro/react/sidebar";

import type { SidebarTriggerContractProps } from "#contracts/types/sidebar-trigger-contract-props.type";

/** Props of the sidebar trigger: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type SidebarTriggerProps = SidebarTriggerContractProps &
  Omit<HeroSidebarTriggerProps, keyof SidebarTriggerContractProps | "aria-label">;
