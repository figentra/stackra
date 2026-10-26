/**
 * Stackra file contract:
 * Purpose: `BarChartProps`, props of the web BarChart: the shared contract plus HeroUI Pro's own container props,
 *          passed through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import type { BarChartRootProps as HeroBarChartRootProps } from "@heroui-pro/react/bar-chart";

import type { BarChartContractProps } from "#contracts/types/bar-chart-contract-props.type";

/**
 * Props of the web BarChart: the shared contract plus HeroUI Pro's own container props, passed through unchanged. The
 * accessible name is `label`, so `aria-label` is left out of the type.
 */
export type BarChartProps = BarChartContractProps &
  Omit<HeroBarChartRootProps, keyof BarChartContractProps | "aria-label">;
