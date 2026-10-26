/**
 * Stackra file contract:
 * Purpose: `AppLayoutAsideTriggerProps`, props of the aside trigger: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import type { AppLayoutAsideTriggerProps as HeroAppLayoutAsideTriggerProps } from "@heroui-pro/react/app-layout";

import type { AppLayoutAsideTriggerContractProps } from "#contracts/types/app-layout-aside-trigger-contract-props.type";

/** Props of the aside trigger: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type AppLayoutAsideTriggerProps = AppLayoutAsideTriggerContractProps &
  Omit<HeroAppLayoutAsideTriggerProps, keyof AppLayoutAsideTriggerContractProps | "aria-label">;
