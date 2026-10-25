/**
 * Stackra file contract:
 * Purpose: unit tests of `FreezeAccountOutput`: a registered shape of the account id and its flag.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FreezeAccountOutput } from "#node/schemas/freeze-account-output.schema";

describe("FreezeAccountOutput", () => {
  it("holds the account and whether it is frozen now", () => {
    const accountId = "lac_01ja0000000000000000000011" as PublicId<"lac">;
    expect({ ...FreezeAccountOutput.create({ accountId, isFrozen: true }) }).toEqual({
      accountId,
      isFrozen: true,
    });
  });
});
