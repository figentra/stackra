/**
 * Stackra file contract:
 * Purpose: unit tests of `readCallOptions`: the shared defaults (version 1, area `app`, no interceptors) and every
 *          shared refusal, for an action and for a query.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 20 and 21); ADR 0305 (rule 30).
 */
import { ActorKind, ApiArea, HttpMethod } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Interceptor } from "#core/bases/interceptor.base";
import { readCallOptions } from "#core/functions/read-call-options.function";

class AuditInterceptor extends Interceptor {
  async intercept(_ctx: unknown, next: () => Promise<unknown>): Promise<unknown> {
    return next();
  }
}

const base = { key: "order.list", actors: [ActorKind.User] };

describe(readCallOptions, () => {
  it("applies the shared defaults", () => {
    expect(readCallOptions("Query", base)).toEqual({
      version: 1,
      area: ApiArea.App,
      interceptors: [],
    });
    expect(
      readCallOptions("Action", {
        ...base,
        key: "order.cancel",
        version: 2,
        area: ApiArea.Admin,
        interceptors: [AuditInterceptor],
      }),
    ).toEqual({ version: 2, area: ApiArea.Admin, interceptors: [AuditInterceptor] });
  });

  it("refuses a malformed key or actor list", () => {
    expect(() => readCallOptions("Query", { ...base, key: "orders" })).toThrow(/snake_case/);
    expect(() => readCallOptions("Query", { ...base, key: "order.list.all" })).toThrow(TypeError);
    expect(() => readCallOptions("Query", { ...base, actors: [] })).toThrow(TypeError);
    expect(() => readCallOptions("Query", { ...base, actors: ["bot" as ActorKind] })).toThrow(
      RangeError,
    );
  });

  it("refuses an endpoint whose method does not fit the kind", () => {
    expect(() =>
      readCallOptions("Query", {
        ...base,
        endpoint: { method: HttpMethod.Delete, path: "/orders" },
      }),
    ).toThrow(/read with GET/);
    expect(() =>
      readCallOptions("Action", { ...base, endpoint: { method: HttpMethod.Get, path: "/orders" } }),
    ).toThrow(/never GET/);
    expect(() =>
      readCallOptions("Query", {
        ...base,
        endpoint: { method: "HEAD" as HttpMethod, path: "/orders" },
      }),
    ).toThrow(RangeError);
    expect(readCallOptions("Query", { ...base, endpoint: false }).version).toBe(1);
  });

  it("refuses a non-interceptor and tool: true without an agent", () => {
    expect(() =>
      readCallOptions("Action", {
        ...base,
        interceptors: [class NotOne {} as unknown as typeof AuditInterceptor],
      }),
    ).toThrow(TypeError);
    expect(() => readCallOptions("Action", { ...base, tool: true })).toThrow(
      /tool_without_agent_actor/,
    );
    expect(() =>
      readCallOptions("Action", { ...base, actors: [ActorKind.ExternalAgent], tool: true }),
    ).not.toThrow();
  });

  it("refuses a query budget that is not a whole number from 1 (STA-1400)", () => {
    expect(() => readCallOptions("Action", { ...base, queryBudget: 0 })).toThrow(RangeError);
    expect(() => readCallOptions("Query", { ...base, queryBudget: 2.5 })).toThrow(/queryBudget/);
    expect(() => readCallOptions("Query", { ...base, queryBudget: 12 })).not.toThrow();
  });
});
