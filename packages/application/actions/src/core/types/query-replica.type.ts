/**
 * Stackra file contract:
 * Purpose: `QueryReplica`, a query's `replica` option: the query is held on clients as a bounded replica of a model's
 *          rows (by age and size, optionally to one value of a dimension), refreshed by change cursor.
 * Boundary: a type only, copied by gen into the clients' replica map. A query without it is not available offline.
 *           Its `handle` answers through `ctx.replica(fill, slice)`, which serves the changes since the client's cursor
 *           or a full fill. The refresh signal is the live query's own: the events of `cache.invalidateOn`.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3: `replica: { of, window, limit, scope? }`); ADR 0315 (decision 1: live
 *                     queries).
 */
import type { AnyClass } from "@stackra/container";

/** How a query is replicated to clients. */
export interface QueryReplica {
  /** The model class whose rows it mirrors. */
  readonly of: AnyClass;

  /** How far back it reaches, as a duration (`"30d"`). */
  readonly window: string;

  /** The most rows it holds, a whole number from 1. */
  readonly limit: number;

  /** The row field that slices it per device (`"legalEntityId"`); unsliced when absent. */
  readonly scope?: string;
}
