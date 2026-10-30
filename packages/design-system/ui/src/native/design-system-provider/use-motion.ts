/**
 * Stackra file contract:
 * Purpose: `useMotion()`, the motion level in force on native: the nearest `DesignSystemProvider`'s resolved level
 *          (the picked one, lowered by the system's reduce-motion setting).
 * Boundary: reads the context only; never throws. Outside a provider it answers `full`, and Reanimated's own default
 *           (`ReduceMotion.System`) still honours the system setting for every animation it runs.
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3.
 */
import { use } from "react";

import type { MotionLevel } from "#contracts/enums/motion-level.enum";

import { DesignSystemContext } from "./design-system-context";

/**
 * The motion level in force.
 * @returns `full`, `reduced` or `none`
 */
export function useMotion(): MotionLevel {
  return use(DesignSystemContext)?.resolvedMotion ?? "full";
}
