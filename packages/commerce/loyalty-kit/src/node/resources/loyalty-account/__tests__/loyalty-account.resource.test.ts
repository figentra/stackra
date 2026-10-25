/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyAccountResource`: the admin resource over the account view, listed under Loyalty with
 *          the star icon, whose list and View are gen's reads and whose Create is the enroll action; the table, filters,
 *          default sort, enrol form, infolist and the bulk Freeze button gen records.
 * Boundary: test only; reads the recorded options and the tree `describeResource` builds, as gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 1 to 13); ADR 0164.
 */
import { kindOf } from "@stackra/container";
import { ApiArea, SortDirection } from "@stackra/contracts";
import { describeResource } from "@stackra/panel";
import { describe, expect, it } from "@stackra/testing";

import { EnrollMemberAction } from "#node/actions/enroll-member.action";
import { FreezeAccountAction } from "#node/actions/freeze-account.action";
import { LoyaltyAccountResource } from "#node/resources/loyalty-account/loyalty-account.resource";

/** The `key` of each node that has one. */
const keys = (nodes: readonly object[] | undefined) =>
  nodes?.map((node) => ("key" in node ? node.key : (node as { kind: string }).kind));

describe("LoyaltyAccountResource", () => {
  it("is the admin resource listed under Loyalty, with gen's reads and the enroll action as Create", () => {
    expect(kindOf(LoyaltyAccountResource)?.kind).toBe("resource");
    expect(kindOf(LoyaltyAccountResource)?.options).toEqual({
      area: ApiArea.Admin,
      navigation: { group: "loyalty_kit::nav.loyalty", icon: "star", order: 30 },
      operations: { list: true, get: true, create: EnrollMemberAction },
    });
  });

  it("records the list's columns, filters and newest-first sort", () => {
    const { table } = describeResource(LoyaltyAccountResource);
    expect(keys(table?.columns)).toEqual(["memberId", "tier", "isFrozen", "frozenAt", "createdAt"]);
    expect(table?.columns[0]).toMatchObject({ copyable: true });
    expect(table?.columns[3]).toMatchObject({ hidden: true });
    expect(keys(table?.filters)).toEqual(["tier", "isFrozen", "createdAt", "trashed"]);
    expect(table?.defaultSort).toEqual({ key: "createdAt", direction: SortDirection.Desc });
  });

  it("records the enrol form, the View page and the bulk Freeze button", () => {
    const tree = describeResource(LoyaltyAccountResource);
    expect(keys(tree.form?.fields)).toEqual(["principalId", "tier"]);
    expect(keys(tree.infolist?.entries)).toEqual([
      "memberId",
      "tier",
      "isFrozen",
      "frozenAt",
      "createdAt",
    ]);
    expect(tree.actions).toEqual([
      expect.objectContaining({ kind: "run", action: FreezeAccountAction, bulk: true }),
    ]);
  });
});
