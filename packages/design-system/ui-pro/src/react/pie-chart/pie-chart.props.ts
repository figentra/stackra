/**
 * Stackra file contract:
 * Purpose: `PieChartProps`, props of the web PieChart: the shared contract plus HeroUI Pro's own container props,
 *          passed through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import type { PieChartRootProps as HeroPieChartRootProps } from "@heroui-pro/react/pie-chart";

import type { PieChartContractProps } from "#contracts/types/pie-chart-contract-props.type";

/**
 * Props of the web PieChart: the shared contract plus HeroUI Pro's own container props, passed through unchanged. The
 * accessible name is `label`, so `aria-label` is left out of the type.
 */
export type PieChartProps = PieChartContractProps &
  Omit<HeroPieChartRootProps, keyof PieChartContractProps | "aria-label">;
