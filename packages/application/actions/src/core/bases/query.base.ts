/**
 * Stackra file contract:
 * Purpose: `Query({ key, actors, ... })`, the kind base of a read: one class drives the `GET` endpoint, the MCP tool
 *          (on by default), the intent, the cache profile and the generated clients. Input and output are the types of
 *          its `handle`.
 * Boundary: called only. A query changes no state: it takes no preconditions, idempotency, job or offline option, runs
 *           without a transaction and is never audited by the pipeline. A binding with constructor dependencies; it
 *           runs only through `ActionPipeline`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20, 21 and 25); ADR 0305 (rules 28 and 31); ADR 0155 (queries are MCP
 *                     tools); ADR 0136 (decision 2: queries have no transaction); ADR 0338 (decision 3: `replica`).
 */
import { createKind } from "@stackra/container";
import { duration } from "@stackra/validation";

import { readCallOptions } from "#core/functions/read-call-options.function";
import type { QueryClass } from "#core/types/query-class.type";
import type { QueryContext } from "#core/types/query-context.type";
import type { QueryOptions } from "#core/types/query-options.type";

/** The instance side every query shares. */
abstract class QueryBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a query. */
  declare readonly "~kind": "query";

  /** Reads and returns the output for `input`; the subclass types both. A Refusal it throws is the call's refusal. */
  abstract handle(input: never, ctx: QueryContext): Promise<unknown>;
}

/** A query instance. */
export type Query = QueryBase;

/** A row field name in camelCase (`legalEntityId`). */
const FIELD = /^[a-z][A-Za-z0-9]*$/;

/** Checks the options of a query and applies their defaults. */
function read(options: QueryOptions) {
  const shared = readCallOptions("Query", options);
  const { cache, replica } = options;
  if (cache !== undefined) {
    try {
      duration(String(cache.ttl));
    } catch {
      throw new RangeError(
        `Query({ cache: { ttl } }) must be a duration such as "5m", got ${JSON.stringify(cache.ttl)}`,
      );
    }
    for (const event of cache.invalidateOn ?? [])
      if (typeof event !== "function")
        throw new TypeError(
          `Query({ cache: { invalidateOn } }) lists event classes (${options.key})`,
        );
  }
  if (replica !== undefined) {
    if (typeof replica.of !== "function")
      throw new TypeError(
        `Query({ replica: { of } }) names the model class it mirrors (${options.key})`,
      );
    try {
      duration(String(replica.window));
    } catch {
      throw new RangeError(
        `Query({ replica: { window } }) must be a duration such as "30d", got ${JSON.stringify(replica.window)}`,
      );
    }
    if (!Number.isSafeInteger(replica.limit) || replica.limit < 1)
      throw new RangeError(
        `Query({ replica: { limit } }) must be a whole number from 1, got ${replica.limit}`,
      );
    if (
      replica.scope !== undefined &&
      (typeof replica.scope !== "string" || !FIELD.test(replica.scope))
    )
      throw new TypeError(
        `Query({ replica: { scope } }) names a row field such as "legalEntityId", got ${JSON.stringify(replica.scope)}`,
      );
  }
  return {
    ...options,
    ...shared,
    tool: options.tool ?? true,
    intent: options.intent ?? false,
  };
}

/**
 * The query kind base.
 *
 * @example
 * export class GetOrderQuery extends Query({
 *   key: "order.get",
 *   actors: [ActorKind.User, ActorKind.Agent, ActorKind.Service],
 * }) {
 *   constructor(orders: OrderService) {
 *     super();
 *     this.orders = orders;
 *   }
 *
 *   async handle(input: GetOrderInput, ctx: QueryContext): Promise<OrderView> {
 *     const order = await this.orders.findOneOrFail({ id: input.orderId });
 *     await ctx.authorize(order);
 *     return this.orders.toView(order);
 *   }
 * }
 */
export const Query = createKind("query", QueryBase, read) as (options: QueryOptions) => QueryClass;
