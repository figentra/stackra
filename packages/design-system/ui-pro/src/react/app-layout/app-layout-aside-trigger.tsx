/**
 * Stackra file contract:
 * Purpose: `AppLayout.AsideTrigger` on HeroUI Pro's `AppLayout.AsideTrigger`: maps the contract's `label` to
 *          `aria-label`.
 * Boundary: no behaviour of its own; the button, tooltip and icon props are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-005.
 */
import {
  AppLayout as HeroAppLayout,
  type AppLayoutAsideTriggerProps as HeroAppLayoutAsideTriggerProps,
} from "@heroui-pro/react/app-layout";

import type { AppLayoutAsideTriggerContractProps } from "#contracts/types/app-layout-contract-props.type";

/** Props of the aside trigger: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type AppLayoutAsideTriggerProps = AppLayoutAsideTriggerContractProps &
  Omit<HeroAppLayoutAsideTriggerProps, keyof AppLayoutAsideTriggerContractProps | "aria-label">;

/** The button that toggles the aside panel. */
export function AppLayoutAsideTrigger({ label, ...rest }: AppLayoutAsideTriggerProps) {
  return <HeroAppLayout.AsideTrigger {...rest} {...(label ? { "aria-label": label } : {})} />;
}
