/**
 * Stackra file contract:
 * Purpose: unit tests of `ActionPermission`: exactly the four matrix states, snake_case, in the order an admin reads
 *          them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); J2-6; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ActionPermission } from "#core/enums/action-permission.enum";

describe("ActionPermission", () => {
  it("holds the four states", () => {
    expect(Enum.values(ActionPermission)).toEqual([
      "off",
      "suggest",
      "after_approval",
      "on_its_own",
    ]);
  });
});
