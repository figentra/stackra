/**
 * Stackra file contract:
 * Purpose: unit tests of `entitiesName`: a module's entity list is its key in SCREAMING_SNAKE with `_ENTITIES`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231; ADR 0097 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { entitiesName } from "#core/functions/entities-name.function";

describe("entitiesName", () => {
  it("upper-cases the module key and adds _ENTITIES", () => {
    expect(entitiesName("loyalty_kit")).toBe("LOYALTY_KIT_ENTITIES");
    expect(entitiesName("scope")).toBe("SCOPE_ENTITIES");
  });
});
