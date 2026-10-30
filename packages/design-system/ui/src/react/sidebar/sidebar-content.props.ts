/**
 * Stackra file contract:
 * Purpose: `SidebarContentProps`, the props of the web `Sidebar.Content` in `sidebar-content.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */
import type { ComponentPropsWithRef } from "react";

import type { LandmarkContractProps } from "#contracts/types/landmark-contract-props.type";

/** Props of the web Sidebar.Content: the landmark's `label` plus a `nav`'s props; its children are groups and menus. */
export type SidebarContentProps = LandmarkContractProps &
  Omit<ComponentPropsWithRef<"nav">, keyof LandmarkContractProps>;
