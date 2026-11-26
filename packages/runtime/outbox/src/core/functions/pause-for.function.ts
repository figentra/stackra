/**
 * Stackra file contract:
 * Purpose: `pauseFor(signal, duration)`, the idle pause of a relay's `work` loop: resolves after `duration`, or at once
 *          when `signal` aborts.
 * Boundary: internal; the outbox relay and the cross-app relay pause with it. It clears its timer and listener, so a
 *           stopped loop leaves nothing scheduled.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4); ADR 0221 (decision 5).
 */
import { Duration } from "@stackra/contracts";

/**
 * Waits `duration` unless `signal` aborts first.
 *
 * @example
 * await pauseFor(shutdown.signal, Duration.seconds(1));
 */
export function pauseFor(signal: AbortSignal, duration: Duration): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, Duration.toMilliseconds(duration));
    signal.addEventListener("abort", done, { once: true });
  });
}
