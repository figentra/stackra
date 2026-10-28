/**
 * Stackra file contract:
 * Purpose: unit tests of `queryCacheKey`: the tenant, the `per` scope and its holder (the caller, the scope node, the
 *          site) lead the key, so the evictor's prefixes cover it; the fingerprint changes with the input, the locale,
 *          the sandbox flag and, per principal only, whom the caller acts for; a platform call writes `-`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 31, as amended 2026-10-28); ADR 0297 (decision 3).
 */
import { CacheKey } from "@stackra/cache";
import { type Actor, ActorKind, Realm, type ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { CallOriginKind } from "#contracts/enums/call-origin-kind.enum";
import { CacheScope } from "#core/enums/cache-scope.enum";
import { queryCacheKey } from "#core/functions/query-cache-key.function";
import type { QueryContext } from "#core/types/query-context.type";

class GetOrderQuery {}

const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const customer: Actor = {
  kind: ActorKind.User,
  id: "usr_1",
  realm: Realm.Customer,
  scopeId: "ten_1",
};

/** A descriptor of `actor`, in `SCOPE` from the storefront `sfr_1` unless `platform`. */
function descriptorOf(
  actor: Actor,
  extra: Partial<CallDescriptor> = {},
  platform = false,
): CallDescriptor {
  return {
    callId: "call_1",
    type: GetOrderQuery,
    kind: "query",
    key: "order.get",
    actor,
    ...(actor.scopeId === undefined ? {} : { scopeId: actor.scopeId }),
    ...(platform ? {} : { scope: SCOPE, origin: { kind: CallOriginKind.Storefront, id: "sfr_1" } }),
    area: "app",
    ...extra,
  } as CallDescriptor;
}

const ctx = { locale: "en", currency: "USD", market: "US", timeZone: "UTC" } as QueryContext;

/** The customer's key of `{ id: 1 }` shared `per` the given scope. */
const at = (per: CacheScope) =>
  queryCacheKey(GetOrderQuery, per, descriptorOf(customer), ctx, { id: 1 });

/** The key of `actor` with an empty input shared `per` the given scope. */
const per = (scope: CacheScope, actor: Actor) =>
  queryCacheKey(GetOrderQuery, scope, descriptorOf(actor), ctx, {});

describe(queryCacheKey, () => {
  it("leads with the tenant, the scope and its holder", async () => {
    expect(await at(CacheScope.Principal)).toMatch(
      /^GetOrderQuery:ten_1:principal:usr_1:[0-9a-f]{64}$/,
    );
    expect(await at(CacheScope.Scope)).toMatch(
      new RegExp(`^GetOrderQuery:ten_1:scope:${SCOPE.id}:`),
    );
    expect(await at(CacheScope.Site)).toMatch(/^GetOrderQuery:ten_1:site:sfr_1:/);
    for (const key of [await at(CacheScope.Principal), await at(CacheScope.Site)])
      expect(key.startsWith(`${CacheKey.of(GetOrderQuery, "ten_1")}:`)).toBe(true);
  });

  it("writes - for a platform call without a scope or a site", async () => {
    const platform: Actor = { kind: ActorKind.Service, id: "svc_1" };
    const descriptor = descriptorOf(platform, {}, true);
    expect(await queryCacheKey(GetOrderQuery, CacheScope.Scope, descriptor, ctx, {})).toMatch(
      /^GetOrderQuery:-:scope:-:/,
    );
    expect(await queryCacheKey(GetOrderQuery, CacheScope.Site, descriptor, ctx, {})).toMatch(
      /^GetOrderQuery:-:site:-:/,
    );
  });

  it("changes with the input, the locale and the sandbox flag", async () => {
    const base = await queryCacheKey(GetOrderQuery, CacheScope.Scope, descriptorOf(customer), ctx, {
      id: 1,
    });
    const keys = [
      await queryCacheKey(GetOrderQuery, CacheScope.Scope, descriptorOf(customer), ctx, { id: 2 }),
      await queryCacheKey(
        GetOrderQuery,
        CacheScope.Scope,
        descriptorOf(customer),
        { ...ctx, locale: "ar" },
        {
          id: 1,
        },
      ),
      await queryCacheKey(
        GetOrderQuery,
        CacheScope.Scope,
        descriptorOf(customer, { sandbox: true }),
        ctx,
        { id: 1 },
      ),
    ];
    for (const key of keys) expect(key).not.toBe(base);
  });

  it("separates whom an agent acts for per principal, and ignores the caller per scope", async () => {
    const agentFor = (user: string): Actor => ({
      kind: ActorKind.Agent,
      id: "agt_1",
      scopeId: "ten_1",
      onBehalfOf: { ...customer, id: user as Actor["id"] } as Actor,
    });
    expect(await per(CacheScope.Principal, agentFor("usr_1"))).not.toBe(
      await per(CacheScope.Principal, agentFor("usr_2")),
    );
    expect(await per(CacheScope.Scope, agentFor("usr_1"))).toBe(
      await per(CacheScope.Scope, customer),
    );
  });
});
