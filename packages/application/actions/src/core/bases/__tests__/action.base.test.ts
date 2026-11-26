/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Action`: the called form records the `action` kind with its options and defaults,
 *          keeps `instanceof` and constructor dependencies, and refuses every malformed option (key, actors, version,
 *          endpoint method, tool without an agent, job without the system actor, job and offline values, precondition
 *          classes, rate limit), records an offline cap and the `accepts` option and refuses malformed ones; a bare
 *          `extends Action` and a missing `handle` fail to compile; the tool default matches gen (a user action is a
 *          tool unless it says `tool: false`) and `effects` takes distinct `Effect` tags only; `onBehalfOf` takes
 *          `{ secondHop: boolean }` only; `credentials: "ignore"` is recorded on an action whose actors are exactly
 *          `[ActorKind.Anonymous]` and refused anywhere else; `stream: true` is recorded with no job, offline, tool or
 *          replayable idempotency, and refused with any of them (`stream_not_replayable`).
 * Boundary: test only; the options are the template's create, expire and freeze actions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16, 20 and 21); ADR 0305 (rules 28 and 30); ADR
 *                     0338 (decision 5); ADR 0337 (decisions 4 and 5).
 */
import { kindOf } from "@stackra/container";
import { ActorKind, ApiArea, HttpMethod, MeterKind } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Effect } from "#contracts/enums/effect.enum";
import { Action } from "#core/bases/action.base";
import { ApprovalCondition } from "#core/bases/approval-condition.base";
import { Interceptor } from "#core/bases/interceptor.base";
import { Precondition } from "#core/bases/precondition.base";
import { ConflictResolution } from "#core/enums/conflict-resolution.enum";
import { Idempotency } from "#core/enums/idempotency.enum";
import { IdMinting } from "#core/enums/id-minting.enum";
import { OfflineMode } from "#core/enums/offline-mode.enum";
import { OfflinePrecondition } from "#core/enums/offline-precondition.enum";
import type { ActionClass } from "#core/types/action-class.type";
import type { ActionContext } from "#core/types/action-context.type";
import type { ActionOptions } from "#core/types/action-options.type";

class AcceptingOrdersPrecondition extends Precondition {
  async check(): Promise<void> {}
}

class TimingInterceptor extends Interceptor {
  async intercept(_ctx: unknown, next: () => Promise<unknown>): Promise<unknown> {
    return next();
  }
}

class Orders {
  readonly placed: string[] = [];
}

const OFFLINE = {
  mode: OfflineMode.Queue,
  idMinting: IdMinting.Client,
  precondition: OfflinePrecondition.None,
  retention: "72h",
  onConflict: [ConflictResolution.ServerWins, ConflictResolution.Manual],
};

class CreateOrderAction extends Action({
  key: "order.create",
  actors: [ActorKind.User, ActorKind.Agent],
  preconditions: [AcceptingOrdersPrecondition],
  interceptors: [TimingInterceptor],
  idempotency: Idempotency.Required,
  rateLimit: { perMinute: 20 },
  tool: true,
  intent: true,
  offline: OFFLINE,
}) {
  readonly orders: Orders;

  constructor(orders: Orders) {
    super();
    this.orders = orders;
  }

  async handle(input: { sku: string }, _ctx: ActionContext): Promise<{ orderId: string }> {
    this.orders.placed.push(input.sku);
    return { orderId: "ord_1" };
  }
}

class ExpireUnpaidOrdersAction extends Action({
  key: "order.expire_unpaid",
  actors: [ActorKind.System],
  job: {
    queue: "maintenance",
    unique: true,
    timeout: "2m",
    retries: 3,
    cron: { schedule: "*/5 * * * *", perScope: true, input: { batchSize: 100 } },
  },
}) {
  async handle(_input: { batchSize: number }): Promise<{ expired: number }> {
    return { expired: 0 };
  }
}

/** The smallest valid options, extended per case. */
const base: ActionOptions = { key: "account.freeze", actors: [ActorKind.User] };

describe("Action", () => {
  it("records the action kind with its options and defaults", () => {
    expect(kindOf(CreateOrderAction)).toEqual({
      kind: "action",
      options: {
        key: "order.create",
        actors: [ActorKind.User, ActorKind.Agent],
        preconditions: [AcceptingOrdersPrecondition],
        interceptors: [TimingInterceptor],
        idempotency: Idempotency.Required,
        rateLimit: { perMinute: 20 },
        tool: true,
        intent: true,
        offline: OFFLINE,
        version: 1,
        area: ApiArea.App,
        structural: false,
      },
    });
    expect(kindOf(ExpireUnpaidOrdersAction)?.options).toMatchObject({
      idempotency: Idempotency.Optional,
      tool: false,
      intent: false,
      preconditions: [],
      interceptors: [],
    });
  });

  it("defaults tool as gen does and records distinct effect tags", () => {
    class FreezeAccountAction extends Action({
      ...base,
      effects: [Effect.Security],
    }) {
      async handle(): Promise<void> {}
    }
    class OptedOutAction extends Action({
      ...base,
      tool: false,
    }) {
      async handle(): Promise<void> {}
    }
    expect(kindOf(FreezeAccountAction)?.options).toMatchObject({
      tool: true,
      effects: [Effect.Security],
    });
    expect(kindOf(OptedOutAction)?.options).toMatchObject({ tool: false });
    expect(() => Action({ ...base, effects: ["external-communication" as Effect] })).toThrow(
      RangeError,
    );
    expect(() => Action({ ...base, effects: [Effect.Bulk, Effect.Bulk] })).toThrow(RangeError);
  });

  it("keeps instanceof and passes constructor dependencies", async () => {
    const orders = new Orders();
    const action = new CreateOrderAction(orders);
    expect(action).toBeInstanceOf(Action);
    await action.handle({ sku: "SKU-1" }, {} as ActionContext);
    expect(orders.placed).toEqual(["SKU-1"]);
  });

  it("refuses a malformed key, actor list or version", () => {
    expect(() => Action({ ...base, key: "Order.Create" })).toThrow(TypeError);
    expect(() => Action({ ...base, key: "orders.order.create" })).toThrow(TypeError);
    expect(() => Action({ ...base, actors: [] })).toThrow(TypeError);
    expect(() => Action({ ...base, actors: ["robot" as ActorKind] })).toThrow(RangeError);
    expect(() => Action({ ...base, version: 0 })).toThrow(RangeError);
    expect(() => Action({ ...base, area: "intranet" as ApiArea })).toThrow(RangeError);
  });

  it("refuses GET, a relative path, and tool or job without the matching actor", () => {
    expect(() =>
      Action({ ...base, endpoint: { method: HttpMethod.Get, path: "/accounts" } }),
    ).toThrow(/never GET/);
    expect(() =>
      Action({ ...base, endpoint: { method: HttpMethod.Put, path: "accounts" } }),
    ).toThrow(TypeError);
    expect(() => Action({ ...base, tool: true })).toThrow(/tool_without_agent_actor/);
    expect(() => Action({ ...base, job: { queue: "default" } })).toThrow(
      /job_without_system_actor/,
    );
    expect(() =>
      Action({
        ...base,
        endpoint: { method: HttpMethod.Put, path: "/accounts/:accountId/freeze" },
      }),
    ).not.toThrow();
  });

  it("refuses bad job, offline, precondition and rate-limit values", () => {
    const system: ActionOptions = { ...base, actors: [ActorKind.System] };
    expect(() => Action({ ...system, job: { timeout: "soon" } })).toThrow(RangeError);
    expect(() => Action({ ...system, job: { retries: -1 } })).toThrow(RangeError);
    expect(() => Action({ ...system, job: { cron: { schedule: "every minute" } } })).toThrow(
      TypeError,
    );
    expect(() => Action({ ...base, offline: { ...OFFLINE, retention: "forever" } })).toThrow(
      RangeError,
    );
    expect(() => Action({ ...base, offline: { ...OFFLINE, onConflict: [] } })).toThrow(RangeError);
    expect(() =>
      Action({ ...base, preconditions: [Orders as unknown as typeof AcceptingOrdersPrecondition] }),
    ).toThrow(TypeError);
    expect(() => Action({ ...base, rateLimit: { perMinute: 0 } })).toThrow(RangeError);
    expect(() => Action({ ...base, rateLimit: { perMinute: 5, by: "ip" as "tenant" } })).toThrow(
      RangeError,
    );
    expect(() => Action({ ...base, idempotency: "always" as Idempotency })).toThrow(RangeError);
  });

  it("records an offline cap and the accepts option, and refuses malformed ones", () => {
    class PriceEvaluator {
      async evaluate(): Promise<undefined> {
        return undefined;
      }
    }
    const cap = { count: 3, amount: 50_000, window: "24h" };
    const accepts = { ruleVersion: "2.4.0", evaluator: PriceEvaluator };
    expect(
      kindOf(Action({ ...base, offline: { ...OFFLINE, cap }, accepts }))?.options,
    ).toMatchObject({ offline: { cap }, accepts });
    const capped = (value: object) =>
      Action({ ...base, offline: { ...OFFLINE, cap: value as typeof cap } });
    expect(() => capped({ window: "24h" })).toThrow(/count, an amount or both/);
    expect(() => capped({ count: 0, window: "24h" })).toThrow(RangeError);
    expect(() => capped({ amount: 1.5, window: "24h" })).toThrow(RangeError);
    expect(() => capped({ count: 1, window: "a day" })).toThrow(RangeError);
    expect(() => Action({ ...base, accepts: { ...accepts, ruleVersion: "v2" } })).toThrow(
      RangeError,
    );
    expect(() =>
      Action({
        ...base,
        accepts: { ruleVersion: "2", evaluator: Orders as unknown as typeof PriceEvaluator },
      }),
    ).toThrow(TypeError);
  });

  it("is called only and makes a subclass implement handle", () => {
    // @ts-expect-error -- Action needs its key and actors, so the bare form is not a constructor
    class Bare extends Action {}
    // @ts-expect-error -- handle is abstract and not implemented
    class Empty extends Action(base) {}
    expect([Bare, Empty]).toHaveLength(2);
    expectTypeOf(Action(base)).toEqualTypeOf<ActionClass>();
  });

  it("records structural, a meter and an offline cap's amount field, and refuses malformed ones", () => {
    class PublishShellAction extends Action({
      ...base,
      key: "shell.publish",
      structural: true,
      meter: { name: "shells.published", kind: MeterKind.Count },
      offline: { ...OFFLINE, cap: { amount: 50_000, amountField: "total", window: "24h" } },
    }) {
      async handle(): Promise<void> {}
    }
    expect(kindOf(PublishShellAction)?.options).toMatchObject({
      structural: true,
      meter: { name: "shells.published", kind: "count" },
      offline: { cap: { amountField: "total" } },
    });
    for (const options of [
      { structural: "yes" },
      { meter: { name: "Messages Sent", kind: MeterKind.Count } },
      { meter: { name: "messages.sent", kind: "average" } },
      { meter: { name: "messages.sent", kind: MeterKind.Sum } },
      { offline: { ...OFFLINE, cap: { count: 1, amountField: "", window: "24h" } } },
    ])
      expect(() => Action({ ...base, ...(options as object) })).toThrow();
  });

  it("records onBehalfOf's second hop, and refuses anything but { secondHop: boolean }", () => {
    expect(kindOf(Action({ ...base, onBehalfOf: { secondHop: true } }))?.options).toMatchObject({
      onBehalfOf: { secondHop: true },
    });
    expect(kindOf(Action(base))?.options["onBehalfOf"]).toBeUndefined();
    for (const onBehalfOf of [true, null, {}, { secondHop: "yes" }, { secondHop: true, hops: 3 }])
      expect(() => Action({ ...base, onBehalfOf } as unknown as ActionOptions)).toThrow(
        /onBehalfOf/,
      );
  });

  it('records credentials: "ignore" on an anonymous-only action, and refuses it anywhere else', () => {
    const anonymous = { ...base, actors: [ActorKind.Anonymous] };
    expect(kindOf(Action({ ...anonymous, credentials: "ignore" }))?.options).toMatchObject({
      credentials: "ignore",
    });
    for (const actors of [
      [ActorKind.User],
      [ActorKind.Anonymous, ActorKind.User],
      [ActorKind.Anonymous, ActorKind.Anonymous],
    ])
      expect(() => Action({ ...base, actors, credentials: "ignore" })).toThrow(
        /needs actors: \[ActorKind\.Anonymous\] exactly/,
      );
    expect(() => Action({ ...anonymous, credentials: "keep" } as unknown as ActionOptions)).toThrow(
      /credentials/,
    );
  });

  /** A stream reaches one live caller once, so nothing may queue it, replay it or hand it to a model. */
  it("records stream: true alone, and refuses it with a job, offline, a tool or a replayable key", () => {
    const stream = {
      key: "message.send",
      actors: [ActorKind.User],
      stream: true,
      tool: false,
      idempotency: Idempotency.Never,
    } as const;
    expect(kindOf(Action(stream))?.options).toMatchObject({ stream: true, tool: false });
    // a user action is a tool by default, so leaving `tool` out is refused too
    const { tool: _tool, ...toolByDefault } = stream;
    expect(() => Action(toolByDefault)).toThrow(/takes no tool.*stream_not_replayable/);
    expect(() => Action({ ...stream, idempotency: Idempotency.Optional })).toThrow(
      /idempotency other than Never/,
    );
    expect(() =>
      Action({ ...stream, actors: [ActorKind.User, ActorKind.Job], job: { queue: "default" } }),
    ).toThrow(/takes no job/);
    expect(() => Action({ ...stream, offline: OFFLINE })).toThrow(/takes no offline/);
    expect(() => Action({ ...stream, stream: "yes" } as unknown as ActionOptions)).toThrow(
      TypeError,
    );
  });

  it("records approval as true or a declared stage with its defaults", () => {
    class AboveThresholdCondition extends ApprovalCondition {
      async needed(): Promise<boolean> {
        return true;
      }
    }
    expect(kindOf(Action({ ...base, approval: true }))?.options).toMatchObject({ approval: true });
    expect(
      kindOf(Action({ ...base, approval: { permission: "billing.coupon.approve" } }))?.options,
    ).toMatchObject({
      approval: { approvals: 1, expiresAfter: "72h", permission: "billing.coupon.approve" },
    });
    expect(
      kindOf(
        Action({
          ...base,
          approval: {
            approvals: 2,
            permission: "billing.coupon.approve",
            expiresAfter: "720h",
            when: AboveThresholdCondition,
          },
        }),
      )?.options,
    ).toMatchObject({
      approval: { approvals: 2, expiresAfter: "720h", when: AboveThresholdCondition },
    });
  });

  it("refuses a malformed approval stage", () => {
    class NotACondition {
      async needed(): Promise<boolean> {
        return true;
      }
    }
    const permission = "billing.coupon.approve";
    for (const approval of [
      "yes",
      { permission: undefined },
      { permission: "" },
      { permission, approvals: 0 },
      { permission, approvals: 1.5 },
      { permission, expiresAfter: "a while" },
      { permission, expiresAfter: "721h" },
      { permission, expiresAfter: "31d" },
      { permission, when: NotACondition },
    ])
      expect(() => Action({ ...base, approval: approval as never })).toThrow(/approval/);
  });

  it("types the `entitlement` option on the entitlement brand (STA-2059)", () => {
    class ExportsEntitlement {
      readonly "~kind" = "entitlement" as const;
    }
    expectTypeOf<{ entitlement: typeof ExportsEntitlement }>().toExtend<
      Pick<ActionOptions, "entitlement">
    >();
    expectTypeOf<{ entitlement: (typeof ExportsEntitlement)[] }>().toExtend<
      Pick<ActionOptions, "entitlement">
    >();
    expectTypeOf<{ entitlement: typeof Orders }>().not.toExtend<
      Pick<ActionOptions, "entitlement">
    >();
  });
});
