/**
 * Stackra file contract:
 * Purpose: `freezeClock(iso)`: pins `Date.now()` and `new Date()` to one instant for the current test, then restores
 *          the real clock when the test finishes.
 * Boundary: fakes `Date` only; timers (`setTimeout`, `setInterval`) keep running for real, so awaited work still
 *           settles. Generic: knows nothing about the `Clock` port of @stackra/contracts.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 2: clock fakes live in `.`).
 */
import { vi } from "vitest";
import { restoreAfterTest } from "#core/functions/restore-after-test.function";

/**
 * Freezes the clock at `iso` until the current test finishes. Called again, it moves the frozen instant. Called in
 * `beforeAll`, the clock stays frozen for the rest of the file unless the returned function is run.
 *
 * @param iso - an ISO 8601 instant, such as `2026-10-21T09:00:00Z`.
 * @returns a function that restores the real clock at once.
 * @throws RangeError when `iso` is not a valid date.
 * @example
 * freezeClock("2026-10-21T09:00:00Z");
 * expect(new Date().toISOString()).toBe("2026-10-21T09:00:00.000Z");
 */
export function freezeClock(iso: string): () => void {
  const now = new Date(iso);
  if (Number.isNaN(now.getTime()))
    throw new RangeError(`freezeClock: "${iso}" is not an ISO 8601 instant`);
  vi.useFakeTimers({ now, toFake: ["Date"] });
  return restoreAfterTest(() => vi.useRealTimers());
}
