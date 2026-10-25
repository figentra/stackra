/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `RouteCaller` port: a driver over public clients answers a query and wraps an
 *          action's answer as sent, and the port is its own token.
 * Boundary: test only; the clients are a local fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decision 4); ADR 0294 (decisions 15 to 17).
 */
import type { ActionRef, ActionResult, QueryRef, RefInput, RefOutput } from "@stackra/clients";
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "vitest";

import { RouteCaller } from "#contracts/ports/route-caller.port";

/** A driver that answers from fixed values. */
class FixedRouteCallerDriver extends Driver(RouteCaller) {
  query<Q extends QueryRef>(_query: Q, _input: RefInput<Q>): Promise<RefOutput<Q>> {
    return Promise.resolve({ total: 3 } as RefOutput<Q>);
  }

  async action<A extends ActionRef>(
    _action: A,
    input: RefInput<A>,
  ): Promise<ActionResult<RefOutput<A>>> {
    return { queued: false, data: input as RefOutput<A> };
  }
}

describe("RouteCaller", () => {
  it("is a port a driver implements", async () => {
    const caller = new FixedRouteCallerDriver();
    expect(caller).toBeInstanceOf(RouteCaller);
    expect(caller).toBeInstanceOf(Port);
    expect(await caller.query({} as QueryRef, {})).toEqual({ total: 3 });
    expect(await caller.action({} as ActionRef, { orderId: "ord_1" })).toEqual({
      queued: false,
      data: { orderId: "ord_1" },
    });
  });

  it("is keyed navigation.RouteCaller", () => {
    expectTypeOf<RouteCaller["~key"]>().toEqualTypeOf<"navigation.RouteCaller">();
  });
});
