/**
 * Stackra file contract:
 * Purpose: `idleTimer(timeoutMs, onIdle)`, the kiosk's idle countdown: `touch()` restarts it, `stop()` ends it, and
 *          `onIdle` runs once each time the countdown runs out; the next touch starts it again.
 * Boundary: internal; the web and native `KioskSurface` feed it their input events. Uses the host's timers only.
 * Runtime: isomorphic
 * Governing contract: ADR 0428 (decision 1); WCAG 2.2 SC 2.2.1 (the timeout is a device setting).
 */
import type { IdleTimer } from "#core/types/idle-timer.type";

/**
 * Starts an idle countdown.
 *
 * @example
 * const timer = idleTimer(90_000, reset);
 * window.addEventListener("pointerdown", timer.touch);
 */
export function idleTimer(timeoutMs: number, onIdle: () => void): IdleTimer {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
    throw new RangeError(
      `idleTimer: the timeout must be a positive number of milliseconds, got ${timeoutMs}`,
    );
  let handle: ReturnType<typeof setTimeout> | undefined;
  const stop = (): void => {
    if (handle !== undefined) clearTimeout(handle);
    handle = undefined;
  };
  const touch = (): void => {
    stop();
    handle = setTimeout(() => {
      handle = undefined;
      onIdle();
    }, timeoutMs);
  };
  touch();
  return Object.freeze({ touch, stop });
}
