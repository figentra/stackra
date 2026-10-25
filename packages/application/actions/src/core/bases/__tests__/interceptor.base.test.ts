/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Interceptor`: the bare kind is registered as `interceptor`, a subclass wraps `next`
 *          and may replace the output, and `intercept` must be implemented.
 * Boundary: test only; the pipeline's composition of several interceptors is tested with `ActionPipeline`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 24).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Interceptor } from "#core/bases/interceptor.base";
import type { QueryContext } from "#core/types/query-context.type";

class TaggingInterceptor extends Interceptor {
  readonly seen: string[] = [];

  async intercept(ctx: QueryContext, next: () => Promise<unknown>): Promise<unknown> {
    this.seen.push(ctx.key);
    const output = (await next()) as { total: number };
    return { ...output, tagged: true };
  }
}

describe("Interceptor", () => {
  it("is the interceptor kind", () => {
    expect(kindOf(TaggingInterceptor)).toEqual({ kind: "interceptor", options: {} });
  });

  it("wraps next and may replace the output", async () => {
    const interceptor = new TaggingInterceptor();
    const ctx = { key: "orders.order.kpis@1" } as QueryContext;
    expect(interceptor).toBeInstanceOf(Interceptor);
    expect(await interceptor.intercept(ctx, async () => ({ total: 3 }))).toEqual({
      total: 3,
      tagged: true,
    });
    expect(interceptor.seen).toEqual(["orders.order.kpis@1"]);
  });

  it("makes a subclass implement intercept", () => {
    // @ts-expect-error -- intercept is abstract and not implemented
    class Empty extends Interceptor {}
    expect(Empty).toBeTypeOf("function");
  });
});
