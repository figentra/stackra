/**
 * Stackra file contract:
 * Purpose: `AppLayoutMenuToggleProps`, props of the menu toggle: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import type { AppLayoutMenuToggleProps as HeroAppLayoutMenuToggleProps } from "@heroui-pro/react/app-layout";

import type { AppLayoutMenuToggleContractProps } from "#contracts/types/app-layout-menu-toggle-contract-props.type";

/** Props of the menu toggle: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type AppLayoutMenuToggleProps = AppLayoutMenuToggleContractProps &
  Omit<HeroAppLayoutMenuToggleProps, keyof AppLayoutMenuToggleContractProps | "aria-label">;
