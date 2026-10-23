/**
 * Stackra file contract:
 * Purpose: `Kpi.Actions` on HeroUI Pro's `KPI.Actions`: maps the contract's `label` to `aria-label`, which HeroUI
 *          Pro gives no default for although the button is icon-only.
 * Boundary: no behaviour of its own; the button props and the icon child are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */
import { KPI as HeroKpi, type KPIActionsProps as HeroKpiActionsProps } from "@heroui-pro/react/kpi";

import type { KpiActionsContractProps } from "#contracts/types/kpi-contract-props.type";

/** Props of the KPI actions button: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type KpiActionsProps = KpiActionsContractProps &
  Omit<HeroKpiActionsProps, keyof KpiActionsContractProps | "aria-label">;

/** The icon-only button at the corner of a KPI card, named by `label`. */
export function KpiActions({ label, ...rest }: KpiActionsProps) {
  return <HeroKpi.Actions {...rest} aria-label={label} />;
}
