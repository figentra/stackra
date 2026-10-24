/**
 * Stackra file contract:
 * Purpose: unit and type tests of `OfflinePrecondition`: an `Enum.of` enum holding the replay checks of a queued call, codes in source order, with a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { OfflinePrecondition } from "#core/enums/offline-precondition.enum";

describe("OfflinePrecondition", () => {
  it("holds its snake_case codes in order", () => {
    expect(Enum.values(OfflinePrecondition)).toEqual(["none", "version"]);
    expect(OfflinePrecondition.None).toBe("none");
    expect(OfflinePrecondition.Version).toBe("version");
  });

  it("types its values", () => {
    expectTypeOf<OfflinePrecondition>().toEqualTypeOf<"none" | "version">();
  });
});
