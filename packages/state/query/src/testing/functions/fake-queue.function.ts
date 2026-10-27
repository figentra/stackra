/**
 * Stackra file contract:
 * Purpose: `fakeQueue(options)`, the helper a test builds an offline queue with: a `QueueFake` seeded with `pending`
 *          waiting calls and `conflicts` conflict records, ready to bind in place of `MutationQueue`.
 * Boundary: test code only; reaches no server, so the seeded counts hold until the test changes them.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's tests (`fakeQueue({ pending: 1 })`).
 */
import { QueueFake } from "#testing/queue.fake";
import type { FakeQueueOptions } from "#testing/types/fake-queue-options.type";

/**
 * A fake offline queue.
 *
 * @example
 * render(<OfflineBanner />, { queue: fakeQueue({ pending: 2 }) });
 */
export function fakeQueue(options: FakeQueueOptions = {}): QueueFake {
  return QueueFake.with(options);
}
