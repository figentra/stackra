/**
 * Stackra file contract:
 * Purpose: unit and type tests of `OfflineMode`: an `Enum.of` enum holding the one offline mode the template declares, codes in source order, with a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { OfflineMode } from "#core/enums/offline-mode.enum";

describe("OfflineMode", () => {
  it("holds its snake_case codes in order", () => {
    expect(Enum.values(OfflineMode)).toEqual(["queue"]);
    expect(OfflineMode.Queue).toBe("queue");
  });

  it("types its values", () => {
    expectTypeOf<OfflineMode>().toEqualTypeOf<"queue">();
  });
});
