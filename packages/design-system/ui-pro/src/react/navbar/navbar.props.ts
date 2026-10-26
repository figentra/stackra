/**
 * Stackra file contract:
 * Purpose: `NavbarProps`, props of the web Navbar: the shared contract plus HeroUI Pro's own, with `aria-label`
 *          renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { NavbarProps as HeroNavbarProps } from "@heroui-pro/react/navbar";

import type { NavbarContractProps } from "#contracts/types/navbar-contract-props.type";

/** Props of the web Navbar: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type NavbarProps = NavbarContractProps &
  Omit<HeroNavbarProps, keyof NavbarContractProps | "aria-label">;
