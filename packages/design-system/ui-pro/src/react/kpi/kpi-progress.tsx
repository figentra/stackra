/**
 * Stackra file contract:
 * Purpose: `Kpi.Progress` on HeroUI Pro's `KPI.Progress`: maps the contract's `tone` to HeroUI Pro's `status`.
 * Boundary: no behaviour of its own; `value` and every other prop are HeroUI Pro's, passed through. HeroUI Pro names
 *          the inner progress bar "Progress" itself and takes no name for it, so there is no `label` here.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */
import { KPI as HeroKpi } from "@heroui-pro/react/kpi";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { KpiProgressProps } from "#react/kpi/kpi-progress.props";

/** The progress bar of a KPI card, from 0 to 100 by `value`, tinted by `tone`. */
// shortcut: the bar's accessible name stays HeroUI Pro's English "Progress"; a `label` prop arrives when HeroUI Pro
// lets the inner bar be named (beta.10 hard-codes it).
export function KpiProgress({ tone, ...rest }: KpiProgressProps) {
  return <HeroKpi.Progress {...rest} {...omitUndefined({ status: tone })} />;
}
