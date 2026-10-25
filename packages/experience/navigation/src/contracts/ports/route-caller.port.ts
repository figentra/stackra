/**
 * Stackra file contract:
 * Purpose: the `RouteCaller` port: how a route's `loader` and `submit` reach the consumed services, behind
 *          `ctx.query(Query, input, options)` and `ctx.action(Action, input)`.
 * Boundary: an abstract class that is its own token, keyed `navigation.RouteCaller`; a driver implements it with
 *           `extends Driver(RouteCaller)` over the client runtime of its target (the browser's cache and transport,
 *           the request's public clients on a Worker). It answers (an action may answer `queued` from the offline
 *           queue) or rejects with the producer's refusal; the route context turns that refusal into
 *           `{ ok: false, error }`. `options.staleTime` and `options.cache` are
 *           hints a driver may ignore.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4: typed clients); ADR 0294 (decisions 15 to 17); ADR 0142 (drivers).
 */
import type { ActionRef, ActionResult, QueryRef, RefInput, RefOutput } from "@stackra/clients";
import { Port } from "@stackra/contracts";

/**
 * Calls consumed queries and actions for the route that is loading or submitting.
 *
 * @example
 * export class PublicClientsRouteCallerDriver extends Driver(RouteCaller) {
 *   query<Q extends QueryRef>(query: Q, input: RefInput<Q>): Promise<RefOutput<Q>> {
 *     return this.clients.query(query, input);
 *   }
 *   async action<A extends ActionRef>(action: A, input: RefInput<A>): Promise<ActionResult<RefOutput<A>>> {
 *     return { queued: false, data: await this.clients.action(action, input) };
 *   }
 * }
 */
export abstract class RouteCaller extends Port {
  /** Type-only port key, so `DriverName<RouteCaller>` narrows to this port's drivers. */
  declare readonly "~key": "navigation.RouteCaller";

  /**
   * The answer of `query` for `input`.
   *
   * @throws ClientError the producer's refusal, or a `TransportError`.
   */
  abstract query<Q extends QueryRef>(
    query: Q,
    input: RefInput<Q>,
    options?: {
      /** How long a cached answer counts as fresh (`30s`), for a driver that caches. */
      readonly staleTime?: string;
      /** The cache profile of the answer on a server that caches per query. */
      readonly cache?: string;
      /** Aborts the call when the navigation is cancelled. */
      readonly signal?: AbortSignal;
    },
  ): Promise<RefOutput<Q>>;

  /**
   * Runs `action` with `input`: sent and answered, or queued while offline when the action may be queued.
   *
   * @throws ClientError the producer's refusal, or a `TransportError`.
   */
  abstract action<A extends ActionRef>(
    action: A,
    input: RefInput<A>,
    options?: {
      /** Aborts the call when the submission is cancelled. */
      readonly signal?: AbortSignal;
    },
  ): Promise<ActionResult<RefOutput<A>>>;
}
