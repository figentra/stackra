/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/query (`fakeQueue`, the `QueueFake` it returns and its
 *          options) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports this package's own entries and other packages' `.`
 *           only; no other package's `./testing` (ADR 0269 decision 3). `QueueFake` is a type here: tests build one
 *           through `fakeQueue`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { fakeQueue } from "#testing/functions/fake-queue.function";
export type { QueueFake } from "#testing/queue.fake";
export type { FakeQueueOptions } from "#testing/types/fake-queue-options.type";
