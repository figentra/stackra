/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: every value the template imports from
 *          `@stackra/events/testing` (`deliverRemoteEvent`, `dispatch`, `drainEvents`, `drainOutbox`) and the
 *          matchers, the outbox fake and the plugin are exported, nothing else is, and `PublishedEvents` resolves.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { Event } from "#core/index";
import * as testing from "#testing/index";
import type { PublishedEvents } from "#testing/index";

describe("@stackra/events/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "EVENTS_TESTING_PLUGIN",
      "OutboxFake",
      "deliverRemoteEvent",
      "dispatch",
      "drainEvents",
      "drainOutbox",
      "toEmit",
      "toRecord",
    ]);
  });

  it("resolves PublishedEvents", () => {
    expectTypeOf<PublishedEvents[number]>().toEqualTypeOf<Event>();
  });
});
