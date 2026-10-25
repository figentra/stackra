/**
 * Stackra file contract:
 * Purpose: unit tests of `registerKind`: it records a bare kind base's kind with `{}` options by default, copies and
 *          freezes the options it is given, and a later call replaces the record.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 25).
 */
import { describe, expect, it } from "@stackra/testing";

import { kindOf } from "#core/functions/kind-of.function";
import { registerKind } from "#core/functions/register-kind.function";

describe("registerKind", () => {
  it("records a bare kind with empty options", () => {
    abstract class Schema {}
    registerKind(Schema, "schema");
    expect(kindOf(Schema)).toEqual({ kind: "schema", options: {} });
  });

  it("copies and freezes the options", () => {
    class Called {}
    const options = { key: "order.cancel" };
    registerKind(Called, "action", options);
    options.key = "changed";
    expect(kindOf(Called)?.options).toEqual({ key: "order.cancel" });
    expect(Object.isFrozen(kindOf(Called)?.options)).toBe(true);
  });

  it("replaces an earlier record of the same class", () => {
    class Twice {}
    registerKind(Twice, "first");
    registerKind(Twice, "second");
    expect(kindOf(Twice)?.kind).toBe("second");
  });
});
