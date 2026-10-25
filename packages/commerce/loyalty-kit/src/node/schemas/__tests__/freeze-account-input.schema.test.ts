/**
 * Stackra file contract:
 * Purpose: unit tests of `FreezeAccountInput`: a registered shape that freezes by default.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FreezeAccountInput } from "#node/schemas/freeze-account-input.schema";

describe("FreezeAccountInput", () => {
  it("freezes unless told otherwise", () => {
    const accountId = "lac_01ja0000000000000000000011" as PublicId<"lac">;
    expect(FreezeAccountInput.create({ accountId } as FreezeAccountInput).isFrozen).toBe(true);
    expect(FreezeAccountInput.create({ accountId, isFrozen: false }).isFrozen).toBe(false);
  });
});
