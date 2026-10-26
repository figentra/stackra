/**
 * Stackra file contract:
 * Purpose: `KpiProgressProps`, props of the KPI progress bar: the shared contract plus HeroUI Pro's own, with `status`
 *          renamed `tone`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */
import type { KPIProgressProps as HeroKpiProgressProps } from "@heroui-pro/react/kpi";

import type { KpiProgressContractProps } from "#contracts/types/kpi-progress-contract-props.type";

/** Props of the KPI progress bar: the shared contract plus HeroUI Pro's own, with `status` renamed `tone`. */
export type KpiProgressProps = KpiProgressContractProps &
  Omit<HeroKpiProgressProps, keyof KpiProgressContractProps | "status">;
