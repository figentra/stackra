/**
 * Stackra file contract:
 * Purpose: `AppLayout.AsideTrigger` on HeroUI Pro's `AppLayout.AsideTrigger`: maps the contract's `label` to
 *          `aria-label`.
 * Boundary: no behaviour of its own; the button, tooltip and icon props are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import { AppLayout as HeroAppLayout } from "@heroui-pro/react/app-layout";

import type { AppLayoutAsideTriggerProps } from "#react/app-layout/app-layout-aside-trigger.props";

/** The button that toggles the aside panel. */
export function AppLayoutAsideTrigger({ label, ...rest }: AppLayoutAsideTriggerProps) {
  return <HeroAppLayout.AsideTrigger {...rest} {...(label ? { "aria-label": label } : {})} />;
}
