/**
 * Stackra file contract:
 * Purpose: `SidebarTriggerProps`, the props of the web `Sidebar.Trigger` in `sidebar-trigger.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */
import type { IconButtonProps } from "#react/icon-button/icon-button.props";

/**
 * Props of the web Sidebar.Trigger: an IconButton whose `icon` and `label` default to the sidebar's own (expand,
 * collapse, or open the phone drawer).
 */
export type SidebarTriggerProps = Partial<Pick<IconButtonProps, "icon" | "label">> &
  Omit<IconButtonProps, "icon" | "label">;
