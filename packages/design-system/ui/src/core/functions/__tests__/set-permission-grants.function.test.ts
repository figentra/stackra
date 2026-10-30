/**
 * Stackra file contract:
 * Purpose: proves `setPermissionGrants` grants and takes permissions for several roles at once, keeps each role's
 *          order with no duplicates, adds a role it had no entry for, and never changes the grants it is given.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
import { setPermissionGrants } from "#core/functions/set-permission-grants.function";

const GRANTS = Object.freeze({
  cashier: Object.freeze(["sell", "refund"]),
  manager: Object.freeze([]),
});

describe("setPermissionGrants", () => {
  it("grants to several roles, appending only what is missing", () => {
    expect(setPermissionGrants(GRANTS, ["cashier", "manager"], ["refund", "void"], true)).toEqual({
      cashier: ["sell", "refund", "void"],
      manager: ["refund", "void"],
    });
  });

  it("takes from a role and adds an entry for a role it did not hold", () => {
    expect(setPermissionGrants(GRANTS, ["cashier"], ["refund"], false)).toEqual({
      cashier: ["sell"],
      manager: [],
    });
    expect(setPermissionGrants(GRANTS, ["owner"], ["sell"], true)).toMatchObject({
      owner: ["sell"],
    });
  });

  it("returns new grants and leaves the old ones alone", () => {
    const next = setPermissionGrants(GRANTS, ["cashier"], ["void"], true);
    expect(next).not.toBe(GRANTS);
    expect(GRANTS.cashier).toEqual(["sell", "refund"]);
  });
});
