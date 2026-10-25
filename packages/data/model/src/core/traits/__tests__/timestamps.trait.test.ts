/**
 * Stackra file contract:
 * Purpose: unit tests of `Timestamps`: both fields start at the creation time, read from the (frozen) clock.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0096; ADR 0294 (decision 27).
 */
import { describe, expect, freezeClock, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { Timestamps } from "#core/traits/timestamps.trait";

class Variant extends Model.with(Timestamps) {}

describe("Timestamps", () => {
  it("starts both times at creation", () => {
    freezeClock("2026-10-24T09:00:00Z");
    const variant = new Variant();
    expect(variant.createdAt.toISOString()).toBe("2026-10-24T09:00:00.000Z");
    expect(variant.updatedAt.toISOString()).toBe("2026-10-24T09:00:00.000Z");
    expect(Timestamps.traitName).toBe("timestamps");
  });
});
