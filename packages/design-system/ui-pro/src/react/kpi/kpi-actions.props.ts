/**
 * Stackra file contract:
 * Purpose: `KpiActionsProps`, props of the KPI actions button: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */
import type { KPIActionsProps as HeroKpiActionsProps } from "@heroui-pro/react/kpi";

import type { KpiActionsContractProps } from "#contracts/types/kpi-actions-contract-props.type";

/** Props of the KPI actions button: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type KpiActionsProps = KpiActionsContractProps &
  Omit<HeroKpiActionsProps, keyof KpiActionsContractProps | "aria-label">;
