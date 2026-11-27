/**
 * Stackra file contract:
 * Purpose: unit tests of `derivePrefix`: the first three letters, the next free three-letter pick when those are
 *          taken, a written prefix checked for shape and ownership, and the refusal when nothing derived is free.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135 (rule 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { derivePrefix } from "#node/feature-scaffold/functions/derive-prefix.function";

describe(derivePrefix, () => {
  it("takes the first three letters, else the next free pick", () => {
    expect(derivePrefix("order-line", new Set())).toBe("ord");
    expect(derivePrefix("order-line", new Set(["ord"]))).toBe("ore");
    expect(derivePrefix("ox", new Set())).toBe("ox");
  });

  it("checks a written prefix", () => {
    expect(derivePrefix("order", new Set(["ord"]), "odr")).toBe("odr");
    expect(() => derivePrefix("order", new Set(["ord"]), "ord")).toThrow(
      "--prefix ord is the public id prefix of another model",
    );
    expect(() => derivePrefix("order", new Set(), "o")).toThrow(
      "--prefix o is not 2 to 6 lowercase letters",
    );
  });

  it("refuses when no derived prefix is free", () => {
    expect(() => derivePrefix("job", new Set(["job"]))).toThrow(
      "no free public id prefix derives from job; pass --prefix <2 to 6 lowercase letters>",
    );
  });
});
