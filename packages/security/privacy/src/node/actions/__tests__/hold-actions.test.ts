/**
 * Stackra file contract:
 * Purpose: unit tests of `PlaceHoldAction`, `ReleaseHoldAction` and `ListHoldsQuery`: user and service callers, no
 *          tool; placing stores a new `lgh_` hold in the session's partition with the actor and the call's time;
 *          releasing marks only a live hold and says whether one matched; listing filters live holds by default, by
 *          record when asked, and maps rows to `LegalHold`s.
 * Boundary: test only; the database is a stand-in that records each statement.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0134 (holds); data-layer gap gov20 (stackra-332).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { PlaceHoldAction } from "#node/actions/place-hold.action";
import { ReleaseHoldAction } from "#node/actions/release-hold.action";
import { ListHoldsQuery } from "#node/queries/list-holds.query";
import { ListHoldsInput } from "#node/schemas/list-holds-input.schema";
import { PlaceHoldInput } from "#node/schemas/place-hold-input.schema";
import { ReleaseHoldInput } from "#node/schemas/release-hold-input.schema";

const NOW = new Date("2026-10-28T09:00:00Z");

/** A database whose statements answer `rows` and are recorded. */
function database(rows: readonly unknown[] = []) {
  const executed: [string, readonly unknown[]][] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[]) => {
      executed.push([sql, params]);
      return rows;
    },
  };
  return { db: { em: () => em } as unknown as Database, executed };
}

describe("legal hold actions", () => {
  it("are user and service calls that no agent tool reaches", () => {
    for (const kind of [PlaceHoldAction, ReleaseHoldAction, ListHoldsQuery]) {
      const options = kindOf(kind)?.options;
      expect(options?.["actors"]).toEqual([ActorKind.User, ActorKind.Service]);
      expect(options?.["tool"]).toBe(false);
    }
  });

  it("places a hold in the session's partition with the actor and time", async () => {
    const { db, executed } = database();
    const ctx = fakeActionContext({ now: () => new Date(NOW) });
    const { holdId } = await new PlaceHoldAction(db).handle(
      PlaceHoldInput.create({ model: "Invoice", recordId: "inv_1", reason: "Matter 14" }),
      ctx,
    );
    expect(holdId).toMatch(/^lgh_/);
    expect(executed[0]?.[0]).toContain('insert into "privacy"."legal_holds"');
    expect(executed[0]?.[0]).toContain("current_setting('app.tenant_id', true)");
    expect(executed[0]?.[1]).toEqual([holdId, "Invoice", "inv_1", "Matter 14", ctx.actor.id, NOW]);
    expect(ctx.recorded.audit).toEqual({ holdId, model: "Invoice", recordId: "inv_1" });
  });

  it("releases only a live hold and says whether one matched", async () => {
    const live = database([{ id: "lgh_1" }]);
    const input = ReleaseHoldInput.create({ holdId: "lgh_1", reason: "Matter closed" });
    const ctx = fakeActionContext({ now: () => new Date(NOW) });
    expect((await new ReleaseHoldAction(live.db).handle(input, ctx)).released).toBe(true);
    expect(live.executed[0]?.[0]).toContain("released_at is null returning id");
    expect(live.executed[0]?.[1]).toEqual([NOW, ctx.actor.id, "Matter closed", "lgh_1"]);
    const gone = database([]);
    expect((await new ReleaseHoldAction(gone.db).handle(input, ctx)).released).toBe(false);
  });

  it("lists live holds by default, by record when asked, as LegalHolds", async () => {
    const row = {
      id: "lgh_1",
      model: "Invoice",
      record_id: "inv_1",
      reason: "Matter 14",
      placed_by: "usr_1",
      placed_at: NOW,
      released_at: null,
    };
    const { db, executed } = database([row]);
    const query = new ListHoldsQuery(db);
    const { holds } = await query.handle(ListHoldsInput.create({}));
    expect(holds).toEqual([
      {
        id: "lgh_1",
        model: "Invoice",
        recordId: "inv_1",
        reason: "Matter 14",
        placedBy: "usr_1",
        placedAt: NOW.toISOString(),
        releasedAt: null,
      },
    ]);
    expect(executed[0]?.[0]).toContain("and released_at is null order by placed_at desc");
    await query.handle(ListHoldsInput.create({ recordId: "inv_1", includeReleased: true }));
    expect(executed[1]?.[0]).not.toContain("released_at is null");
    expect(executed[1]?.[1]).toEqual(["inv_1"]);
  });
});
