/**
 * Stackra file contract:
 * Purpose: `NavbarMenuToggleProps`, props of `Navbar.MenuToggle`: the shared contract plus HeroUI Pro's own, with
 *          `srLabel` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { NavbarMenuToggleProps as HeroNavbarMenuToggleProps } from "@heroui-pro/react/navbar";

import type { NavbarMenuToggleContractProps } from "#contracts/types/navbar-menu-toggle-contract-props.type";

/** Props of `Navbar.MenuToggle`: the shared contract plus HeroUI Pro's own, with `srLabel` renamed `label`. */
export type NavbarMenuToggleProps = NavbarMenuToggleContractProps &
  Omit<HeroNavbarMenuToggleProps, keyof NavbarMenuToggleContractProps | "srLabel">;
