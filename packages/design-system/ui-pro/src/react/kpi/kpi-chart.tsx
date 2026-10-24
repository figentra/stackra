/**
 * Stackra file contract:
 * Purpose: `Kpi.Chart` on HeroUI Pro's KPI chart: the sparkline draws in when it mounts, as every Stackra chart does
 *          (ADR 0329). HeroUI Pro turns the sparkline's animation off; this turns it back on with Recharts' `auto`
 *          (still under reduced motion and when rendered on the server) and the theme's `reveal` step.
 * Boundary: only the sparkline's animation defaults change, and a caller's `areaProps` win over them; every other prop
 *          passes through to HeroUI Pro unchanged.
 * Runtime: browser
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 4); ADR 0303 (decision 7).
 */
import { KPI as HeroKpi } from "@heroui-pro/react/kpi";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import type { ComponentProps } from "react";

const REVEAL = motionTiming(STACKRA_THEME, "reveal");

/** Props of `Kpi.Chart`: HeroUI Pro's own, passed through. */
export type KpiChartProps = ComponentProps<typeof HeroKpi.Chart>;

/** The sparkline of the metric's history, drawing in on the theme's reveal step. */
export function KpiChart({ areaProps, ...rest }: KpiChartProps) {
  return (
    <HeroKpi.Chart
      {...rest}
      areaProps={{
        isAnimationActive: "auto",
        animationDuration: REVEAL.durationMs,
        animationEasing: STACKRA_THEME.motion["reveal"]?.easing ?? "ease-out",
        ...areaProps,
      }}
    />
  );
}
