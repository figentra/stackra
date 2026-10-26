/**
 * Stackra file contract:
 * Purpose: `KpiChartProps`, props of `Kpi.Chart`: HeroUI Pro's own, passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0329 (motion layer); ADR 0310 (decision 4); ADR 0303 (decision
 *                     7).
 */
import type { KPI as HeroKpi } from "@heroui-pro/react/kpi";
import type { ComponentProps } from "react";

/** Props of `Kpi.Chart`: HeroUI Pro's own, passed through. */
export type KpiChartProps = ComponentProps<typeof HeroKpi.Chart>;
