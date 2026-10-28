/**
 * Stackra file contract:
 * Purpose: unit tests of `Retention`: the options are recorded for @stackra/database to read, and an unknown policy, an
 *          empty basis or a zero keep is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0134 (decision 3); data-layer gap gov4.
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { Retention } from "#core/traits/retention.trait";

class AiThread extends Model.with(
  Retention({ keep: Duration.days(90), basis: "createdAt", policy: "hard" }),
) {}

describe("Retention", () => {
  it("records its options", () => {
    const [record] = traitsOf(AiThread);
    expect(record?.name).toBe("retention");
    expect(record?.options).toEqual({
      keep: Duration.days(90),
      basis: "createdAt",
      policy: "hard",
    });
  });

  it("refuses an unknown policy, an empty basis or a zero keep", () => {
    const keep = Duration.days(1);
    expect(() => Retention({ keep, basis: "at", policy: "shred" as "hard" })).toThrow(TypeError);
    expect(() => Retention({ keep, basis: "", policy: "hard" })).toThrow(TypeError);
    expect(() => Retention({ keep: Duration.days(0), basis: "at", policy: "hard" })).toThrow(
      TypeError,
    );
  });
});
