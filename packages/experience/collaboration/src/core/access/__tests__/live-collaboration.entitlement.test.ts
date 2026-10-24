/**
 * Stackra file contract:
 * Purpose: unit tests of `LiveCollaborationEntitlement`: an entitlement of the feature kind that counts no model, and
 *          a class a source answers a boolean for.
 * Boundary: test only; the source is `fakeEntitlements` from the entitlements package's test entry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0270 (decision 5); ADR 0215 (decision 1).
 */
import { kindOf } from "@stackra/container";
import { fakeEntitlements } from "@stackra/entitlements/testing";
import { describe, expect, it } from "@stackra/testing";

import { LiveCollaborationEntitlement } from "#core/access/live-collaboration.entitlement";

describe("LiveCollaborationEntitlement", () => {
  it("is a feature entitlement that counts no model", () => {
    expect(kindOf(LiveCollaborationEntitlement)).toEqual({
      kind: "entitlement",
      options: { kind: "feature" },
    });
  });

  it("is granted or not by a source", async () => {
    const granted = fakeEntitlements([[LiveCollaborationEntitlement, true]]);
    expect(await granted.grant(LiveCollaborationEntitlement, undefined)).toBe(true);
    expect(await fakeEntitlements().grant(LiveCollaborationEntitlement, undefined)).toBeUndefined();
  });
});
