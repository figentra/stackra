/**
 * Stackra file contract:
 * Purpose: `Kpi.Icon` on HeroUI Pro's `KPI.Icon`: maps the contract's `tone` to HeroUI Pro's `status`.
 * Boundary: no behaviour of its own; every other prop is HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-007.
 */
import { KPI as HeroKpi, type KPIIconProps as HeroKpiIconProps } from "@heroui-pro/react/kpi";

import type { KpiIconContractProps } from "#contracts/types/kpi-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the KPI icon: the shared contract plus HeroUI Pro's own, with `status` renamed `tone`. */
export type KpiIconProps = KpiIconContractProps &
  Omit<HeroKpiIconProps, keyof KpiIconContractProps | "status">;

/** The icon of a KPI card, its background tinted by `tone`. */
export function KpiIcon({ tone, ...rest }: KpiIconProps) {
  return <HeroKpi.Icon {...rest} {...omitUndefined({ status: tone })} />;
}
