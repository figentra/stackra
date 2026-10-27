/**
 * Stackra file contract:
 * Purpose: `PublicClients`, one request's anonymous callers of the gateway's public area: `query(Query, input)` and
 *          `action(Action, input)`, each resolving the decoded answer.
 * Boundary: a type only. The route adapters expose it as `ctx.query` and `ctx.action`.
 * Runtime: isomorphic
 * Governing contract: ADR 0082 (API areas); ADR 0260 (decision 4).
 */
import type { ActionRef } from "#core/types/action-ref.type";
import type { CallOptions } from "#core/types/call-options.type";
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";

/** One request's public callers. */
export interface PublicClients {
  /**
   * Calls the public query `query`.
   *
   * @throws ClientError the producer's refusal, or a `TransportError`.
   */
  query<Q extends QueryRef>(
    query: Q,
    input: RefInput<Q>,
    options?: Pick<CallOptions, "signal">,
  ): Promise<RefOutput<Q>>;

  /**
   * Calls the public action `action`.
   *
   * @throws ClientError the producer's refusal, or a `TransportError`.
   */
  action<A extends ActionRef>(
    action: A,
    input: RefInput<A>,
    options?: Pick<CallOptions, "idempotencyKey" | "signal">,
  ): Promise<RefOutput<A>>;
}
