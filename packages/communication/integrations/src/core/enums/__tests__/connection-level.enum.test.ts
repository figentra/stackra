/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectionLevel`: a user and a scope node, and no level of the scope tree by name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 9); ADR 0327 (decision 2: levels are data).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ConnectionLevel } from "#core/enums/connection-level.enum";

describe("ConnectionLevel", () => {
  it("holds the user and the scope node", () => {
    expect(Enum.values(ConnectionLevel)).toEqual(["user", "scope"]);
    expect(ConnectionLevel.User).toBe("user");
    expect(ConnectionLevel.Scope).toBe("scope");
  });

  it("names no level of the scope tree", () => {
    expect(Object.keys(ConnectionLevel)).toEqual(["User", "Scope"]);
  });
});
