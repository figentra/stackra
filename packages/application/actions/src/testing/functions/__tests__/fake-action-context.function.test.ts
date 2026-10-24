/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeActionContext`: `authorize` allows and records, `afterCommit` and `audit` are recorded
 *          (never run), `period` and `startOfDay` use the frozen clock and time zone, `run`, `signal` and `dispatch`
 *          reject unless overridden, and the actor can be set.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (testing helpers); ADR 0136.
 */
import { type Actor, ActorKind, Realm } from "@stackra/contracts";
import { describe, expect, freezeClock, it } from "@stackra/testing";

import { fakeActionContext } from "#testing/functions/fake-action-context.function";

class RedeemWorkflow {}

class SendMessageAction {
  async handle(_input: { text: string }): Promise<void> {}
}

describe(fakeActionContext, () => {
  it("records authorize, afterCommit and audit", async () => {
    const ctx = fakeActionContext();
    const record = { id: "ord_1" };
    let ran = false;
    await ctx.authorize(record);
    ctx.afterCommit(() => {
      ran = true;
    });
    ctx.audit({ reason: "count" });
    ctx.audit({ by: "staff" });
    expect(ctx.recorded.authorized).toEqual([record]);
    expect(ctx.recorded.afterCommit).toHaveLength(1);
    expect(ran).toBe(false);
    expect(ctx.recorded.audit).toEqual({ reason: "count", by: "staff" });
    expect(ctx.idempotencyKey).toBeUndefined();
  });

  it("reads periods on its frozen clock and time zone", () => {
    freezeClock("2026-10-24T10:00:00.000Z");
    const ctx = fakeActionContext({ timeZone: "Asia/Riyadh" });
    expect(ctx.startOfDay().toISOString()).toBe("2026-10-23T21:00:00.000Z");
    expect(ctx.period({ range: "last_7_days" }).days).toBe(7);
  });

  it("rejects run, signal and dispatch unless overridden", async () => {
    const ctx = fakeActionContext();
    await expect(ctx.run(RedeemWorkflow, {})).rejects.toThrow(/no run/);
    await expect(ctx.signal(RedeemWorkflow, {})).rejects.toThrow(/no signal/);
    await expect(ctx.dispatch(SendMessageAction, { text: "hi" })).rejects.toThrow(/no dispatch/);
    const stubbed = fakeActionContext({ run: async <O>() => ({ redeemed: 5 }) as O });
    expect(await stubbed.run<{ redeemed: number }>(RedeemWorkflow, {})).toEqual({ redeemed: 5 });
  });

  it("takes the actor", () => {
    const actor: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };
    expect(fakeActionContext({ actor }).actor).toBe(actor);
  });
});
