/**
 * Stackra file contract:
 * Purpose: `entityCacheOf`, whether a `CrudService` read of one row is served by the entity cache, and under which key
 *          and lifetime: `[CacheKey.of(Model, id, scopeId, scopeNodeId), ttlMs]` for MikroORM's `cache` option.
 * Boundary: pure apart from reading the connected resolver's call context. It answers undefined (read the database)
 *           unless the model is `Cached`, the read's whole filter is `{ id }` (no visibility condition, no other
 *           option), no transaction is running (a writer always reads the row fresh) and the ORM's result cache is
 *           `EntityResultCacheAdapter` (never the ORM's per-process default, which nothing evicts). The key carries
 *           the tenant and the scope node because the entries live in the shared namespace and row-level security
 *           reads the scope; `CacheKey.of(Model, id)` covers every scope's entry of the row.
 * Runtime: node
 * Governing contract: ADR 0150 (decisions 2 and 5); ADR 0327 (decision 9: isolation in the database); data-layer gap
 *                     ca5.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import type { ExtensionContext } from "@stackra/actions";
import { ContextStorage } from "@stackra/actions/contracts";
import { CacheKey } from "@stackra/cache";
import type { AnyClass } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { cacheTtlOf } from "@stackra/model";

import { VISIBILITY_HOST } from "#core/constants/visibility-host.constant";
import { EntityResultCacheAdapter } from "#core/orm/entity-result-cache.adapter";

/** What a key part holds for a call with no tenant or scope node. */
const NONE = "-";

/**
 * The entity cache of a read of `model` by `filter`.
 *
 * @returns the ORM `cache` option, or undefined to read the database.
 * @throws TypeError when the model is `Cached` and has encrypted fields (`cacheTtlOf`).
 * @example
 * entityCacheOf(em, Product, { id: "prd_01J…" }); // ["Product:prd_01J…:ten_1:scp_1", 600000]
 */
export function entityCacheOf(
  em: EntityManager,
  model: AnyClass,
  filter: unknown,
): [string, number] | undefined {
  const ttl = cacheTtlOf(model);
  if (ttl === undefined || typeof filter !== "object" || filter === null) return undefined;
  const keys = Reflect.ownKeys(filter);
  const id = (filter as { readonly id?: unknown }).id;
  if (keys.length !== 1 || keys[0] !== "id" || typeof id !== "string") return undefined;
  if (em.isInTransaction()) return undefined;
  if (em.config.get("resultCache").adapter !== EntityResultCacheAdapter) return undefined;
  const { resolver } = VISIBILITY_HOST;
  const context =
    resolver?.has(ContextStorage) === true
      ? (resolver.get(ContextStorage).current() as ExtensionContext | undefined)
      : undefined;
  return [
    CacheKey.of(model, id, context?.scopeId ?? NONE, context?.scope?.id ?? NONE),
    Duration.toMilliseconds(ttl),
  ];
}
