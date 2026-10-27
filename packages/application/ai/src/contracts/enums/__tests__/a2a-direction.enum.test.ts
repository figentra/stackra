/**
 * Stackra file contract:
 * Purpose: unit test of `A2aDirection`: it holds exactly the codes of the `ai.a2a_tasks.direction` column.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231; ADR 0100 (decision 10).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { A2aDirection } from "#contracts/enums/a2a-direction.enum";

describe("A2aDirection", () => {
  it("holds the two directions of the migration's enum column", () => {
    expect(Enum.values(A2aDirection)).toEqual(["inbound", "outbound"]);
  });
});
