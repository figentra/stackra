/**
 * Stackra file contract:
 * Purpose: unit test of `SystemRole`: the built-in role codes the template's widgets name (`SystemRole.Owner`,
 *          `SystemRole.Manager`) and staff.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decision 2); ADR 0273.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SystemRole } from "#core/enums/system-role.enum";

describe("SystemRole", () => {
  it("holds owner, manager and staff", () => {
    expect(Enum.values(SystemRole)).toEqual(["owner", "manager", "staff"]);
    expect([SystemRole.Owner, SystemRole.Manager]).toEqual(["owner", "manager"]);
  });
});
