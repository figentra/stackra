/**
 * Stackra file contract:
 * Purpose: unit tests of `Partitioned`: the options are recorded with the `premake` default for @stackra/database to
 *          read, and a bad interval or premake is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); data-layer gaps db12, sc4.
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { Partitioned } from "#core/traits/partitioned.trait";

class MeterEvent extends Model.with(
  Partitioned({ by: "occurredAt", interval: "month", retain: Duration.days(400) }),
) {}

describe("Partitioned", () => {
  it("records its options with the premake default", () => {
    const [record] = traitsOf(MeterEvent);
    expect(record?.name).toBe("partitioned");
    expect(record?.options).toEqual({
      by: "occurredAt",
      interval: "month",
      retain: Duration.days(400),
      premake: 2,
    });
  });

  it("refuses an unknown interval or premake", () => {
    expect(() => Partitioned({ by: "at", interval: "hour" as "day" })).toThrow(TypeError);
    expect(() => Partitioned({ by: "at", interval: "day", premake: -1 })).toThrow(TypeError);
  });
});
