/**
 * Stackra file contract:
 * Purpose: `RadialChartProps`, props of the web RadialChart: the shared contract plus HeroUI Pro's own container
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import type { RadialChartRootProps as HeroRadialChartRootProps } from "@heroui-pro/react/radial-chart";

import type { RadialChartContractProps } from "#contracts/types/radial-chart-contract-props.type";

/**
 * Props of the web RadialChart: the shared contract plus HeroUI Pro's own container props, passed through unchanged. The
 * accessible name is `label`, so `aria-label` is left out of the type.
 */
export type RadialChartProps = RadialChartContractProps &
  Omit<HeroRadialChartRootProps, keyof RadialChartContractProps | "aria-label">;
