/**
 * Stackra file contract:
 * Purpose: `useMotion()`, the motion level in force on web: the nearest `DesignSystemProvider`'s resolved level, or,
 *          outside one, `reduced` when the browser asks for reduced motion and `full` otherwise.
 * Boundary: reads the context and `prefers-reduced-motion` (through Motion's hook); never throws, so a component
 *           rendered without a provider (a test, an embed) still animates sensibly.
 * Runtime: browser
 * Governing contract: ADR 0329 (motion layer); ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3.
 */
import { useReducedMotion } from "motion/react";
import { use } from "react";

import type { MotionLevel } from "#contracts/enums/motion-level.enum";
import { resolveMotion } from "#core/functions/resolve-motion.function";

import { DesignSystemContext } from "./design-system-context";

/**
 * The motion level in force.
 * @returns `full`, `reduced` or `none`
 */
export function useMotion(): MotionLevel {
  const state = use(DesignSystemContext);
  const isSystemReduced = useReducedMotion() ?? false;
  return state?.resolvedMotion ?? resolveMotion("full", isSystemReduced);
}
