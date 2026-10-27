/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: it exports exactly the `EventOutbox` and `RegionBus`
 *          ports, and the `EventMeta` and `RecordedEvent` types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { EventMeta, RecordedEvent } from "#contracts/index";

describe("@stackra/events/contracts", () => {
  it("exports exactly EventOutbox and RegionBus", () => {
    expect(Object.keys(contracts)).toEqual(["EventOutbox", "RegionBus"]);
  });

  it("resolves its types", () => {
    expectTypeOf<EventMeta["id"]>().toEqualTypeOf<string>();
    expectTypeOf<EventMeta["occurredAt"]>().toEqualTypeOf<Date>();
    expectTypeOf<RecordedEvent["meta"]>().toEqualTypeOf<EventMeta>();
    expectTypeOf<RecordedEvent<{ points: number }>["event"]>().toEqualTypeOf<{ points: number }>();
  });
});
