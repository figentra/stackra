/**
 * Stackra file contract:
 * Purpose: `springCurve` plays a spring preset's physics from rest to its target and samples it into a CSS `linear()`
 *          easing with the time it takes to settle, so a CSS transition (`--spring-<name>`) moves as Motion and
 *          Reanimated do with the same stiffness, damping and mass.
 * Boundary: pure. Settled means within 0.1% of the target and nearly still; a spring that never settles in 3 seconds is
 *           cut there (an underdamped preset that loose is a theme mistake `defineTheme` does not catch).
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, the motion family).
 */
import type { SpringToken } from "#contracts/types/spring-token.type";

/** The integration step, in seconds. */
const STEP = 0.001;
/** The longest a curve is drawn over, in milliseconds. */
const LONGEST_MS = 3000;
/** How close to rest counts as settled. */
const REST = 0.001;

/** A sample as CSS writes it. */
const round = (value: number) => Number(value.toFixed(3));

/**
 * A spring as a CSS easing and its duration.
 * @param spring - the preset's physics
 * @returns `css`, a `linear()` easing, and `durationMs`, the time to settle in whole milliseconds
 */
export function springCurve(spring: SpringToken): {
  readonly css: string;
  readonly durationMs: number;
} {
  const { stiffness, damping, mass } = spring;
  const path: number[] = [0];
  let position = 0;
  let velocity = 0;
  let settledAt = LONGEST_MS;
  for (let ms = 1; ms <= LONGEST_MS; ms += 1) {
    // Semi-implicit Euler: stable for the stiff presets at a 1ms step.
    velocity += ((-stiffness * (position - 1) - damping * velocity) / mass) * STEP;
    position += velocity * STEP;
    path.push(position);
    if (Math.abs(position - 1) < REST && Math.abs(velocity) * STEP < REST / 10) {
      settledAt = ms;
      break;
    }
  }
  // About one sample per 15ms, 8 to 60 of them, evenly spaced, so `linear()` needs no stops.
  const count = Math.min(60, Math.max(8, Math.ceil(settledAt / 15)));
  const samples = Array.from({ length: count + 1 }, (_, index) =>
    index === count ? 1 : round(path[Math.round((index * settledAt) / count)] ?? 1),
  );
  return { css: `linear(${samples.join(", ")})`, durationMs: settledAt };
}
