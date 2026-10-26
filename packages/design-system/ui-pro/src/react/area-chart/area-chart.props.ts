/**
 * Stackra file contract:
 * Purpose: `AreaChartProps`, props of the web AreaChart: the shared contract plus HeroUI Pro's own container props,
 *          passed through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import type { AreaChartRootProps as HeroAreaChartRootProps } from "@heroui-pro/react/area-chart";

import type { AreaChartContractProps } from "#contracts/types/area-chart-contract-props.type";

/**
 * Props of the web AreaChart: the shared contract plus HeroUI Pro's own container props, passed through unchanged. The
 * accessible name is `label`, so `aria-label` is left out of the type.
 */
export type AreaChartProps = AreaChartContractProps &
  Omit<HeroAreaChartRootProps, keyof AreaChartContractProps | "aria-label">;
