/**
 * Stackra file contract:
 * Purpose: `Sidebar.Trigger` on HeroUI Pro's `Sidebar.Trigger`: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; the button props are HeroUI's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import {
  Sidebar as HeroSidebar,
  type SidebarTriggerProps as HeroSidebarTriggerProps,
} from "@heroui-pro/react/sidebar";

import type { SidebarTriggerContractProps } from "#contracts/types/sidebar-contract-props.type";

/** Props of the sidebar trigger: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type SidebarTriggerProps = SidebarTriggerContractProps &
  Omit<HeroSidebarTriggerProps, keyof SidebarTriggerContractProps | "aria-label">;

/** The button that toggles the sidebar open and closed. */
export function SidebarTrigger({ label, ...rest }: SidebarTriggerProps) {
  return <HeroSidebar.Trigger {...rest} aria-label={label} />;
}
