/**
 * Stackra file contract:
 * Purpose: unit tests of `@Meter`: meters are kept in source order with their window, a model without one has none,
 *          and a bad key, a field on a count, a missing field, a bad field name, a repeated key and a non-model target
 *          are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0216 (decisions 1 and 2).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { Meter } from "#core/decorators/meter.decorator";
import { MeterKind } from "#core/enums/meter-kind.enum";

@Meter({
  key: "matters.active",
  kind: MeterKind.Count,
})
@Meter({
  key: "storage.bytes",
  kind: MeterKind.Sum,
  field: "sizeBytes",
  window: Duration.days(30),
})
class Matter extends Model {
  sizeBytes = 0;
}

class Plain extends Model {}

describe(Meter, () => {
  it("records the meters in source order", () => {
    expect(Meter.on(Matter)).toEqual([
      { key: "matters.active", kind: "count" },
      { key: "storage.bytes", kind: "sum", field: "sizeBytes", window: Duration.days(30) },
    ]);
    expect(Meter.on(Plain)).toEqual([]);
  });

  it("refuses a bad declaration", () => {
    expect(() => Meter({ key: "Matters", kind: MeterKind.Count })).toThrow(/meter key/);
    expect(() => Meter({ key: "m", kind: MeterKind.Count, field: "x" })).toThrow(/reads no field/);
    expect(() => Meter({ key: "m", kind: MeterKind.Max })).toThrow(/needs a field/);
    expect(() => Meter({ key: "m", kind: MeterKind.Last, field: "Bad-name" })).toThrow(/camelCase/);
    expect(() => {
      @Meter({
        key: "m",
        kind: MeterKind.Count,
      })
      @Meter({
        key: "m",
        kind: MeterKind.Count,
      })
      class Twice extends Model {}
      return Twice;
    }).toThrow(/declared twice/);
    expect(() => {
      @Meter({
        key: "m",
        kind: MeterKind.Count,
      })
      class NotAModel {}
      return NotAModel;
    }).toThrow(TypeError);
  });
});
