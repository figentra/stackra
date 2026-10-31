/**
 * Stackra file contract:
 * Purpose: `motionDurationNames`, the custom properties a still or system-reduced web page drops to 0ms: every motion
 *          step's `--duration-<step>` and every spring's `--spring-<name>-duration`.
 * Boundary: pure; names only.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, the motion family); ADR 0329 (motion layer).
 */
import type { Theme } from "#contracts/types/theme.type";

/**
 * The durations a still or system-reduced page drops to 0ms: every motion step and every spring.
 * @param theme - the theme
 */
export function motionDurationNames(theme: Theme): string[] {
  return [
    ...Object.keys(theme.motion).map((name) => `--duration-${name}`),
    ...Object.keys(theme.animation.springs).map((name) => `--spring-${name}-duration`),
  ];
}
