/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsIssuedQuery`: the `points.stats_today` query for staff only, with no route, cached five
 *          minutes; it sums today's earns and redeems since the call's midnight and reports redeemed points as
 *          positive.
 * Boundary: test only; the query is called directly with a recording entry repository and a fake context.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rules 31 to 33).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Repository } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import type { LedgerEntry } from "#node/models/ledger-entry.model";
import { PointsIssuedQuery } from "#node/queries/points-issued.query";
import { PointsIssuedInput } from "#node/schemas/points-issued-input.schema";

describe("PointsIssuedQuery", () => {
  it("is the staff-only points.stats_today query with no route", () => {
    expect(kindOf(PointsIssuedQuery)?.options).toMatchObject({
      key: "points.stats_today",
      permission: LoyaltyAccountPermissions.read,
      actors: [ActorKind.User],
      endpoint: false,
      cache: { ttl: "5m" },
    });
  });

  it("sums today's earns and redeems since the call's midnight", async () => {
    const sum = vi.fn(async (_field: string, where: { kind: EntryKind }) =>
      where.kind === EntryKind.Earn ? 420 : -60,
    );
    const query = new PointsIssuedQuery({ sum } as unknown as Repository<LedgerEntry>);
    const ctx = fakeActionContext();

    const view = await query.handle(PointsIssuedInput.create({}), ctx);

    expect({ ...view }).toEqual({ earned: 420, redeemed: 60 });
    expect(sum).toHaveBeenCalledWith("points", {
      kind: EntryKind.Earn,
      at: { $gte: ctx.startOfDay() },
    });
  });
});
