/**
 * Stackra file contract:
 * Purpose: `queryCacheKey`, the cache key of one query call: `<Query>:<scopeId>:<per>:<holder>:<fingerprint>`, where the
 *          holder is the caller (`principal`), the scope node (`scope`) or the call origin's site (`site`), and the
 *          fingerprint covers the input, the request facts the answer may read (locale, currency, market, time zone,
 *          sandbox) and, per principal, the whole actor with whom it acts for.
 * Boundary: pure apart from the digest. The tenant (`scopeId`, `-` for a platform call) comes first, so
 *           `CacheKey.of(Query, scopeId)` covers every entry of one tenant and `CacheKey.of(Query)` every entry:
 *           `QueryCacheEvictorListener` forgets by exactly those prefixes, so the two change together. The key carries
 *           the tenant itself because the entries sit in the shared cache namespace (`SHARED_CACHE_CONTEXT`).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 31, as amended 2026-10-28: `cache.per`); ADR 0297 (decision 3: the public key of a
 *                     site); ADR 0150 (decision 2: keys are scoped).
 */
import type { AnyClass } from "@stackra/container";
import { CacheKey } from "@stackra/cache";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { CacheScope } from "#core/enums/cache-scope.enum";
import { fingerprintOf } from "#core/functions/fingerprint-of.function";
import type { QueryContext } from "#core/types/query-context.type";

/** What part of a key a platform call (no tenant, scope or site) writes. */
const NONE = "-";

/**
 * The key of `type` called as `descriptor` with `input`, shared `per` the given scope.
 *
 * @example
 * await queryCacheKey(GetOrderQuery, CacheScope.Principal, descriptor, ctx, { orderId });
 * // "GetOrderQuery:ten_1:principal:usr_1:9f86d0…"
 */
export async function queryCacheKey(
  type: AnyClass,
  per: CacheScope,
  descriptor: CallDescriptor,
  ctx: QueryContext,
  input: unknown,
): Promise<CacheKey> {
  const holder =
    per === CacheScope.Principal
      ? descriptor.actor.id
      : per === CacheScope.Scope
        ? (descriptor.scope?.id ?? NONE)
        : (descriptor.origin?.id ?? NONE);
  const fingerprint = await fingerprintOf(
    descriptor.key,
    input ?? null,
    {
      locale: ctx.locale,
      currency: ctx.currency,
      market: ctx.market,
      timeZone: ctx.timeZone,
      sandbox: descriptor.sandbox === true,
    },
    per === CacheScope.Principal ? descriptor.actor : null,
  );
  return CacheKey.of(type, descriptor.scopeId ?? NONE, per, holder, fingerprint);
}
