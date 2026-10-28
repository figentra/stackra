/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Query`: the called form records the `query` kind with `tool` on by default, keeps
 *          constructor dependencies, takes a cache profile and a `GET` override, and refuses a non-GET endpoint, a bad
 *          cache duration, a `per` outside `CacheScope` or a non-class in `invalidateOn`; records a replica and refuses a malformed one; a bare
 *          `extends Query` fails to compile.
 * Boundary: test only; the options are the template's KPI and storefront queries.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16 and 21); ADR 0305 (rules 28 and 31); ADR 0338
 *                     (decision 3).
 */
import { kindOf } from "@stackra/container";
import { ActorKind, ApiArea, HttpMethod } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Query } from "#core/bases/query.base";
import { CacheScope } from "#core/enums/cache-scope.enum";
import type { QueryClass } from "#core/types/query-class.type";
import type { QueryContext } from "#core/types/query-context.type";
import type { QueryOptions } from "#core/types/query-options.type";

class OrderPaid extends DomainEvent {}

class Catalogue {
  readonly titles = new Map([["prd_1", "Kettle"]]);
}

class OrderKpisQuery extends Query({
  key: "order.kpis",
  actors: [ActorKind.User, ActorKind.Agent],
  intent: true,
  cache: { ttl: "5m", invalidateOn: [OrderPaid] },
}) {
  async handle(_input: { range: string }, _ctx: QueryContext): Promise<{ orders: number }> {
    return { orders: 3 };
  }
}

class GetProductBySlugQuery extends Query({
  key: "product.get_by_slug",
  area: ApiArea.Public,
  actors: [ActorKind.Anonymous, ActorKind.User],
  endpoint: { method: HttpMethod.Get, path: "/public/products/by-slug/:slug" },
}) {
  readonly catalogue: Catalogue;

  constructor(catalogue: Catalogue) {
    super();
    this.catalogue = catalogue;
  }

  async handle(input: { productId: string }): Promise<{ title: string | undefined }> {
    return { title: this.catalogue.titles.get(input.productId) };
  }
}

const base: QueryOptions = { key: "order.get", actors: [ActorKind.User] };

describe("Query", () => {
  it("records the query kind with tool on by default", () => {
    expect(kindOf(OrderKpisQuery)).toEqual({
      kind: "query",
      options: {
        key: "order.kpis",
        actors: [ActorKind.User, ActorKind.Agent],
        intent: true,
        cache: { ttl: "5m", invalidateOn: [OrderPaid] },
        tool: true,
        version: 1,
        area: ApiArea.App,
        interceptors: [],
      },
    });
    expect(kindOf(Query({ ...base, tool: false }))?.options["tool"]).toBe(false);
    expect(kindOf(GetProductBySlugQuery)?.options["area"]).toBe(ApiArea.Public);
  });

  it("passes constructor dependencies", async () => {
    const query = new GetProductBySlugQuery(new Catalogue());
    expect(query).toBeInstanceOf(Query);
    expect(await query.handle({ productId: "prd_1" })).toEqual({ title: "Kettle" });
  });

  it("refuses a non-GET endpoint, a bad cache and an explicit tool without an agent", () => {
    expect(() =>
      Query({ ...base, endpoint: { method: HttpMethod.Post, path: "/orders" } }),
    ).toThrow(/read with GET/);
    expect(() => Query({ ...base, cache: { ttl: "a while" } })).toThrow(RangeError);
    expect(() =>
      Query({
        ...base,
        cache: { ttl: "1m", invalidateOn: ["order.paid" as unknown as typeof OrderPaid] },
      }),
    ).toThrow(TypeError);
    expect(
      kindOf(Query({ ...base, cache: { ttl: "1m", per: CacheScope.Scope } }))?.options,
    ).toMatchObject({
      cache: { per: "scope" },
    });
    expect(() =>
      Query({ ...base, cache: { ttl: "1m", per: "tenant" as unknown as CacheScope } }),
    ).toThrow(/must be a CacheScope/);
    expect(() => Query({ ...base, tool: true })).toThrow(/tool_without_agent_actor/);
    expect(() => Query({ ...base, key: "order" })).toThrow(TypeError);
  });

  it("records a replica and refuses a malformed one", () => {
    class Sale {}
    const replica = { of: Sale, window: "30d", limit: 500, scope: "legalEntityId" };
    expect(kindOf(Query({ ...base, replica }))?.options).toMatchObject({ replica });
    const replicated = (value: object) => Query({ ...base, replica: value as typeof replica });
    expect(() => replicated({ ...replica, of: "sale" })).toThrow(TypeError);
    expect(() => replicated({ ...replica, window: "a month" })).toThrow(RangeError);
    expect(() => replicated({ ...replica, limit: 0 })).toThrow(RangeError);
    expect(() => replicated({ ...replica, scope: "legal_entity_id" })).toThrow(TypeError);
  });

  it("is called only", () => {
    // @ts-expect-error -- Query needs its key and actors, so the bare form is not a constructor
    class Bare extends Query {}
    expect(Bare).toBeTypeOf("function");
    expectTypeOf(Query(base)).toEqualTypeOf<QueryClass>();
  });
});
