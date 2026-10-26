/**
 * Stackra file contract:
 * Purpose: `RadarChartProps`, props of the web RadarChart: the shared contract plus HeroUI Pro's own container props,
 *          passed through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import type { RadarChartRootProps as HeroRadarChartRootProps } from "@heroui-pro/react/radar-chart";

import type { RadarChartContractProps } from "#contracts/types/radar-chart-contract-props.type";

/**
 * Props of the web RadarChart: the shared contract plus HeroUI Pro's own container props, passed through unchanged. The
 * accessible name is `label`, so `aria-label` is left out of the type.
 */
export type RadarChartProps = RadarChartContractProps &
  Omit<HeroRadarChartRootProps, keyof RadarChartContractProps | "aria-label">;
