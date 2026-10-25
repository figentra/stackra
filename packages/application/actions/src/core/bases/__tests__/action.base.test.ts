/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Action`: the called form records the `action` kind with its options and defaults,
 *          keeps `instanceof` and constructor dependencies, and refuses every malformed option (key, actors, version,
 *          endpoint method, tool without an agent, job without the system actor, job and offline values, precondition
 *          classes, rate limit), records an offline cap and the `accepts` option and refuses malformed ones; a bare
 *          `extends Action` and a missing `handle` fail to compile.
 * Boundary: test only; the options are the template's create, expire and freeze actions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16, 20 and 21); ADR 0305 (rules 28 and 30); ADR
 *                     0338 (decision 5); ADR 0337 (decisions 4 and 5).
 */
import { kindOf } from "@stackra/container";
import { ActorKind, ApiArea, HttpMethod } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Action } from "#core/bases/action.base";
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
    const cap = { count: 3, amount: 50_000, amountField: "total", window: "24h" };
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
    expect(() => capped({ count: 1, amountField: "total", window: "1d" })).toThrow(TypeError);
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
});
