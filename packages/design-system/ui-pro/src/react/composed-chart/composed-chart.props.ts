/**
 * Stackra file contract:
 * Purpose: `ComposedChartProps`, props of the web ComposedChart: the shared contract plus HeroUI Pro's own container
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import type { ComposedChartRootProps as HeroComposedChartRootProps } from "@heroui-pro/react/composed-chart";

import type { ComposedChartContractProps } from "#contracts/types/composed-chart-contract-props.type";

/**
 * Props of the web ComposedChart: the shared contract plus HeroUI Pro's own container props, passed through unchanged. The
 * accessible name is `label`, so `aria-label` is left out of the type.
 */
export type ComposedChartProps = ComposedChartContractProps &
  Omit<HeroComposedChartRootProps, keyof ComposedChartContractProps | "aria-label">;
