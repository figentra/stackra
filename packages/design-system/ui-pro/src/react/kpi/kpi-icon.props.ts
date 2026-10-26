/**
 * Stackra file contract:
 * Purpose: `KpiIconProps`, props of the KPI icon: the shared contract plus HeroUI Pro's own, with `status` renamed
 *          `tone`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */
import type { KPIIconProps as HeroKpiIconProps } from "@heroui-pro/react/kpi";

import type { KpiIconContractProps } from "#contracts/types/kpi-icon-contract-props.type";

/** Props of the KPI icon: the shared contract plus HeroUI Pro's own, with `status` renamed `tone`. */
export type KpiIconProps = KpiIconContractProps &
  Omit<HeroKpiIconProps, keyof KpiIconContractProps | "status">;
