/**
 * Stackra file contract:
 * Purpose: unit tests of `run`: it throws before a testing app compiled; on the compiled app it runs a call through the
 *          real pipeline as the given actor, resolving to the output with the events published during it; a refusal
 *          resolves with `ok: false` (and `output` throws it); a repeated Idempotency-Key replays; a bug rejects; the
 *          result carries the call's audit entry (STA-820); an action runs with no ApprovalGate bound (STA-813).
 * Boundary: test only; `@stackra/events/testing` adds `app.events` and `toRecord`, `@stackra/errors/testing` adds
 *           `toRefuseWith`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0138 (as amended).
 */
import { Driver, Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { type Actor, ActorKind, Clock, Realm } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import { DomainEvent } from "@stackra/events";
import { dispatch } from "@stackra/events/testing";
import { describe, expect, it } from "@stackra/testing";

import { AccessControl, IdempotencyStore } from "#contracts/index";
import {
  Action,
  type ActionContext,
  Idempotency,
  IdempotencyKeyRequiredError,
  MemoryIdempotencyStoreDriver,
  Query,
} from "#core/index";
import "#testing/index";
import { run } from "#testing/functions/run.function";

class OrderPlaced extends DomainEvent {}

class OutOfStockError extends Refusal({ kind: ErrorKind.Conflict }) {}

class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

class WallClock extends Clock {
  now(): Date {
    return new Date();
  }
}

class PlaceOrderAction extends Action({
  key: "order.place",
  actors: [ActorKind.User],
  idempotency: Idempotency.Required,
}) {
  placed = 0;

  async handle(input: { sku: string }, ctx: ActionContext): Promise<{ orderId: string }> {
    ctx.audit({ sku: input.sku });
    if (input.sku === "none") throw OutOfStockError.create();
    this.placed += 1;
    await dispatch(new OrderPlaced());
    return { orderId: `ord_${this.placed}` };
  }
}

class BrokenQuery extends Query({ key: "order.broken", actors: [ActorKind.User] }) {
  async handle(): Promise<never> {
    throw new Error("bug");
  }
}

class FixtureModule extends Module {}

registerWiring({
  member: "fixture",
  root: FixtureModule,
  bindings: [
    { module: "fixture", provide: PlaceOrderAction, deps: [] },
    { module: "fixture", provide: BrokenQuery, deps: [] },
  ],
});

const as: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };

/** The fixture app with an allowing AccessControl and the memory idempotency store. */
function compile() {
  return createTestingModule(FixtureModule)
    .override(AccessControl, new AllowAll())
    .override(IdempotencyStore, new MemoryIdempotencyStoreDriver(new WallClock()))
    .compile();
}

describe(run, () => {
  it("throws before an app compiled", async () => {
    await expect(
      run(PlaceOrderAction, { sku: "kettle" }, { as, idempotencyKey: "k0" }),
    ).rejects.toThrow(/createTestingModule/);
  });

  it("runs through the pipeline and returns the output with the published events", async () => {
    await compile();
    const placed = await run(PlaceOrderAction, { sku: "kettle" }, { as, idempotencyKey: "k1" });
    expect(placed.ok).toBe(true);
    expect(placed.output).toEqual({ orderId: "ord_1" });
    expect(placed.error).toBeUndefined();
    expect(placed).toRecord(OrderPlaced);
    const replay = await run(PlaceOrderAction, { sku: "kettle" }, { as, idempotencyKey: "k1" });
    expect(replay.output).toEqual({ orderId: "ord_1" });
    expect(replay.events).toEqual([]);
  });

  it("resolves a refusal, whose output throws it", async () => {
    await compile();
    const refused = await run(PlaceOrderAction, { sku: "none" }, { as, idempotencyKey: "k2" });
    expect(refused.ok).toBe(false);
    expect(refused).toRefuseWith(refusal(OutOfStockError));
    expect(() => refused.output).toThrow(OutOfStockError);
    expect(await run(PlaceOrderAction, { sku: "kettle" }, { as })).toRefuseWith(
      refusal(IdempotencyKeyRequiredError),
    );
  });

  it("hands back the call's audit entry, and none for a query", async () => {
    await compile();
    const placed = await run(PlaceOrderAction, { sku: "kettle" }, { as, idempotencyKey: "k3" });
    expect(placed.audit).toMatchObject({ outcome: "ok", fields: { sku: "kettle" } });
    const refused = await run(PlaceOrderAction, { sku: "none" }, { as, idempotencyKey: "k4" });
    expect(refused.audit).toMatchObject({ outcome: "refused", code: refused.error?.code });
    await expect(run(BrokenQuery, {}, { as })).rejects.toThrow("bug");
  });

  it("runs an action with no ApprovalGate bound (STA-813)", async () => {
    await compile();
    expect((await run(PlaceOrderAction, { sku: "kettle" }, { as, idempotencyKey: "k5" })).ok).toBe(
      true,
    );
  });

  it("rejects on a bug", async () => {
    await compile();
    await expect(run(BrokenQuery, {}, { as })).rejects.toThrow("bug");
  });
});
