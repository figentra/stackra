/**
 * Stackra file contract:
 * Purpose: how many dots of an indeterminate dot loader are lit at a moment, and when the next change is due.
 * Boundary: pure maths; the components own the timers.
 * Runtime: any
 * Governing contract: .agents/specs/sta-2017-dot-loader/spec.md (FR-001)
 */
import { DOT_LOADER } from "#core/constants/dot-loader.constant";

/**
 * The lit dots of a `count`-dot build at `elapsedMs` into the loop, and the milliseconds until that number changes.
 * The loop is `count` steps of `dotMs`, then `holdMs` with every dot lit, then `clearMs` with none: 1280 ms for 9.
 */
export function dotLoaderLit(elapsedMs: number, count: number): { lit: number; nextMs: number } {
  const { dotMs, holdMs, clearMs } = DOT_LOADER;
  const build = count * dotMs;
  const loop = build + holdMs + clearMs;
  const at = Math.max(0, elapsedMs) % loop;
  if (at < build) {
    const step = Math.floor(at / dotMs);
    return { lit: step + 1, nextMs: (step + 1) * dotMs - at };
  }
  if (at < build + holdMs) return { lit: count, nextMs: build + holdMs - at };
  return { lit: 0, nextMs: loop - at };
}
