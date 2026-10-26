/**
 * Stackra file contract:
 * Purpose: `Kpi.Icon` on HeroUI Pro's `KPI.Icon`: maps the contract's `tone` to HeroUI Pro's `status`.
 * Boundary: no behaviour of its own; every other prop is HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */
import { KPI as HeroKpi } from "@heroui-pro/react/kpi";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { KpiIconProps } from "#react/kpi/kpi-icon.props";

/** The icon of a KPI card, its background tinted by `tone`. */
export function KpiIcon({ tone, ...rest }: KpiIconProps) {
  return <HeroKpi.Icon {...rest} {...omitUndefined({ status: tone })} />;
}
