/**
 * Stackra file contract:
 * Purpose: the web `RouteProgress`: a row of 2 px dots across the top while a route loads, lit forward from the
 *          inline start (the right in Arabic) as the trickle grows, the leading dot in the emphasis colour (the brand's
 *          dot loader), filling and fading out when the load ends. A named `progressbar` with
 *          no value, since the trickle is not a real measure; reduced motion holds it still and drops the fade.
 * Boundary: draws nothing while idle; pointer events pass through. Fixed to the viewport by default, or absolute in
 *           the nearest positioned parent. The name defaults to the `ui` catalogue.
 * Runtime: browser
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28); ADR 0302 (decision 3);
 *          .agents/specs/sta-2017-dot-loader/spec.md (FR-005); WCAG 2.2 SC 2.3.3 and SC 4.1.2.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { ROUTE_PROGRESS_TIMING } from "#core/constants/route-progress-timing.constant";
import { dotLoaderFilled } from "#core/functions/dot-loader-filled.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useMotion } from "#react/design-system-provider/use-motion";
import { DotGrid } from "#react/dot-loader/dot-grid";
import { useUiText } from "#react/hooks/use-ui-text";
import { useRouteProgress } from "#react/route-progress/use-route-progress";
import type { RouteProgressProps } from "#react/route-progress/route-progress.props";

/** The dots across the top edge: 2 px each, spread over the width. */
const ROUTE_DOTS = 96;

/** The thin loading bar across the top of the app. */
export function RouteProgress({
  isLoading,
  label,
  isFixed = true,
  className,
}: RouteProgressProps): ReactElement | null {
  const t = useUiText();
  const isReduced = useMotion() !== "full";
  const { value, isVisible } = useRouteProgress(isLoading, isReduced);
  if (!isVisible) return null;
  const lit = dotLoaderFilled(value, 0, 1, ROUTE_DOTS);
  return (
    <div
      role="progressbar"
      aria-label={label ?? t(UI_KEYS.ui.route_progress.label)}
      aria-busy={isLoading}
      data-slot="route-progress"
      className={cn(
        isFixed ? "fixed" : "absolute",
        "inset-x-0 top-0 z-(--z-overlay) h-0.5 pointer-events-none",
        className,
      )}
      style={{
        opacity: isLoading ? 1 : 0,
        transition: isReduced ? "none" : `opacity ${ROUTE_PROGRESS_TIMING.fadeMs}ms ease-out`,
      }}
    >
      <DotGrid
        cols={ROUTE_DOTS}
        rows={1}
        dot={2}
        lit={lit}
        emphasisAt={lit - 1}
        color="var(--accent)"
        emphasis="var(--core, var(--accent))"
      />
    </div>
  );
}
