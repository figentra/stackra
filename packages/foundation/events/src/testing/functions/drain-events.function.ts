/**
 * Stackra file contract:
 * Purpose: `drainEvents()`, the after-commit flush of a test: it runs every listener of the events queued on the
 *          testing app compiled last, including events those listeners dispatch, until nothing is queued.
 * Boundary: in process only; what was written to the outbox waits for `drainOutbox()`. A listener failure is
 *           returned and kept for `app.listeners.failures`, never thrown.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0078 (decisions 2 and 4).
 */
import type { ListenerDelivery } from "#core/index";
import { currentHarness } from "#testing/functions/current-harness.function";

/**
 * Drains the current app's bus.
 *
 * @returns the deliveries made, failures included.
 * @throws Error when no testing app has been compiled.
 * @example
 * await app.transaction(() => accounts.earn(member, purchase));
 * await drainEvents();
 */
export async function drainEvents(): Promise<readonly ListenerDelivery[]> {
  return currentHarness().bus.drain();
}
