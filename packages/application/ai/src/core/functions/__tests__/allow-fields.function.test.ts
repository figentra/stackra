/**
 * Stackra file contract:
 * Purpose: unit tests of `allowFields`: only the listed paths of the class survive, nested paths keep their shape, an
 *          absent path or an unlisted class contributes nothing, and inherited keys are never read.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0360 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { allowFields } from "#core/functions/allow-fields.function";

const facts = {
  id: "cus_1",
  email: "a@example.com",
  profile: { tier: "gold", birthDate: "1990-01-01" },
};

describe("allowFields", () => {
  it("keeps only the listed paths, nested ones in place", () => {
    expect(allowFields(facts, "customer", { customer: ["id", "profile.tier", "missing"] })).toEqual(
      {
        id: "cus_1",
        profile: { tier: "gold" },
      },
    );
  });

  it("denies a class with no list", () => {
    expect(allowFields(facts, "health", { customer: ["id"] })).toEqual({});
    expect(allowFields(facts, "toString", {})).toEqual({});
  });

  it("never reads inherited keys", () => {
    expect(allowFields(facts, "customer", { customer: ["constructor", "id.length"] })).toEqual({});
  });
});
