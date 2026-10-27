/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/events (`dispatch`, `drainEvents`, `drainOutbox`,
 *          `deliverRemoteEvent`, the `OutboxFake` and `RegionBusFake`, the `toEmit` and `toRecord` matchers and the
 *          testing-module plugin) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Importing it registers the matchers with `expect` and the
 *           plugin with the testing module; `sideEffects` stays `false` because only vitest loads `./testing` and
 *           never tree-shakes it. Imports `.`, `./contracts`, `@stackra/container/testing` and `@stackra/testing`
 *           only; no other package's `./testing` (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { EVENTS_TESTING_PLUGIN } from "#testing/constants/events-testing-plugin.constant";
export { deliverRemoteEvent } from "#testing/functions/deliver-remote-event.function";
export { dispatch } from "#testing/functions/dispatch.function";
export { drainEvents } from "#testing/functions/drain-events.function";
export { drainOutbox } from "#testing/functions/drain-outbox.function";
export { OutboxFake } from "#testing/outbox.fake";
export { RegionBusFake } from "#testing/region-bus.fake";
export { toEmit } from "#testing/to-emit.matcher";
export { toRecord } from "#testing/to-record.matcher";
export type { PublishedEvents } from "#testing/types/published-events.type";
