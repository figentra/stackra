/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ConflictResolution`: an `Enum.of` enum holding the resolutions the pending-changes view offers, codes in source order, with a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ConflictResolution } from "#core/enums/conflict-resolution.enum";

describe("ConflictResolution", () => {
  it("holds its snake_case codes in order", () => {
    expect(Enum.values(ConflictResolution)).toEqual(["server_wins", "client_retry", "manual"]);
    expect(ConflictResolution.ServerWins).toBe("server_wins");
    expect(ConflictResolution.ClientRetry).toBe("client_retry");
    expect(ConflictResolution.Manual).toBe("manual");
  });

  it("types its values", () => {
    expectTypeOf<ConflictResolution>().toEqualTypeOf<"server_wins" | "client_retry" | "manual">();
  });
});
