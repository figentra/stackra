/**
 * Stackra file contract:
 * Purpose: the web `StatusIndicator`: a state's name after a shape-coded icon in the state's colour (default a dashed
 *          ring, accent a dotted square, success a ringed check, warning a triangle, danger an octagon), so the state
 *          reads without colour; the shape pulses while `isAttention` is set, unless the viewer reduces motion.
 * Boundary: the icon is decorative (the text names the state); never a live region. Colour from the theme's role
 *           variables, as the StatusBadge dot.
 * Runtime: browser
 * Governing contract: gap inventory row 30 (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 1.4.1 and
 *          SC 2.3.3 (animation from interactions).
 */
import type { ReactElement } from "react";
import type { Tone } from "@stackra/contracts";
import { cn } from "@heroui/react";
import {
  CircleCheck,
  CircleDashed,
  OctagonX,
  SquareDot,
  TriangleAlert,
} from "@stackra/icons/react/lucide-icons";
import type { LucideIcon } from "lucide-react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { motion, useReducedMotion } from "motion/react";

import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { STATUS_DOT_ROLE } from "#core/constants/status-dot-role.constant";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import type { StatusIndicatorProps } from "#react/status-indicator/status-indicator.props";

/** The shape of each tone: every one differs in outline, not only in colour. */
const SHAPE: Readonly<Record<Tone, LucideIcon>> = Object.freeze({
  default: CircleDashed,
  accent: SquareDot,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: OctagonX,
});

/** The attention pulse: a soft fade and swell, once a second and a bit, forever. */
const PULSE = { opacity: [1, 0.45, 1], scale: [1, 1.15, 1] };
const PULSE_TIMING = motionTiming(STACKRA_THEME, "pulse");
const PULSE_TRANSITION = {
  duration: PULSE_TIMING.durationMs / 1000,
  repeat: Infinity,
  ease: PULSE_TIMING.bezier ?? "easeInOut",
} as const;

/** A state as colour, shape and text together, pulsing when it needs attention. */
export function StatusIndicator({
  tone = "default",
  icon,
  isAttention = false,
  size = "md",
  children,
  className,
  ...rest
}: StatusIndicatorProps): ReactElement {
  const isReduced = useReducedMotion() ?? false;
  const Shape = SHAPE[tone];
  const pulses = isAttention && !isReduced;
  return (
    <span
      {...rest}
      data-slot="status-indicator"
      data-tone={tone}
      {...(isAttention ? { "data-attention": "" } : {})}
      className={cn(
        "inline-flex items-center gap-1.5",
        size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm",
        className,
      )}
    >
      <motion.span
        aria-hidden
        data-slot="status-indicator-shape"
        className="inline-flex shrink-0"
        style={{ color: `var(--${STATUS_DOT_ROLE[tone]})` }}
        animate={pulses ? PULSE : { opacity: 1, scale: 1 }}
        transition={pulses ? PULSE_TRANSITION : { duration: 0 }}
      >
        {icon === undefined ? (
          <Shape size={ICON_SIZES[size]} aria-hidden />
        ) : (
          <SlotIcon icon={icon} />
        )}
      </motion.span>
      <span>{children}</span>
    </span>
  );
}
