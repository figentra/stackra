/**
 * Stackra file contract:
 * Purpose: the web `RouteProgress`: a 2 px accent bar across the top while a route loads, trickling forward from the
 *          inline start (the right in Arabic), filling and fading out when the load ends. A named `progressbar` with
 *          no value, since the trickle is not a real measure; reduced motion holds it still and drops the fade.
 * Boundary: draws nothing while idle; pointer events pass through. Fixed to the viewport by default, or absolute in
 *           the nearest positioned parent. The name defaults to the `ui` catalogue.
 * Runtime: browser
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3 and
 *          SC 4.1.2.
 */
import { cn } from "@heroui/react";
import { useReducedMotion } from "motion/react";
import type { ReactElement } from "react";

import { ROUTE_PROGRESS_TIMING } from "#core/constants/route-progress-timing.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { useRouteProgress } from "#react/route-progress/use-route-progress";
import type { RouteProgressProps } from "#react/route-progress/route-progress.props";

/** The thin loading bar across the top of the app. */
export function RouteProgress({
  isLoading,
  label,
  isFixed = true,
  className,
}: RouteProgressProps): ReactElement | null {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const { value, isVisible } = useRouteProgress(isLoading, isReduced);
  if (!isVisible) return null;
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
      <div
        data-slot="route-progress-fill"
        className="h-full bg-accent"
        style={{
          width: `${value * 100}%`,
          transition: isReduced ? "none" : `width ${ROUTE_PROGRESS_TIMING.trickleMs}ms ease-out`,
        }}
      />
    </div>
  );
}
