/**
 * Stackra file contract:
 * Purpose: unit tests of `deriveShape`: each call returns a fresh, named `Schema` subclass of kind `schema` whose kind
 *          options record the derivation.
 * Boundary: test only; imports the internal subject through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 25).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { deriveShape } from "#core/functions/derive-shape.function";

describe("deriveShape", () => {
  it("returns a named Schema subclass that records its options", () => {
    const Derived = deriveShape("PickType(Order)", { pick: ["total"] });
    expect(Derived.name).toBe("PickType(Order)");
    expect(Object.getPrototypeOf(Derived)).toBe(Schema);
    expect(kindOf(Derived)).toEqual({ kind: "schema", options: { pick: ["total"] } });
  });

  it("returns a new class on every call", () => {
    expect(deriveShape("A", {})).not.toBe(deriveShape("A", {}));
  });
});
