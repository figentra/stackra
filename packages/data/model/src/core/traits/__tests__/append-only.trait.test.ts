/**
 * Stackra file contract:
 * Purpose: unit tests of `AppendOnly`: it adds no field and marks the model in the trait registry.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0134.
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { AppendOnly } from "#core/traits/append-only.trait";

class AccessLogEntry extends Model.with(AppendOnly) {}

describe("AppendOnly", () => {
  it("adds no field and marks the model", () => {
    expect(Object.keys(new AccessLogEntry())).toEqual([]);
    expect(traitsOf(AccessLogEntry)).toEqual([{ name: "append_only", options: {} }]);
  });
});
