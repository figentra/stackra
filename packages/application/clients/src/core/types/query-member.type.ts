/**
 * Stackra file contract:
 * Purpose: `QueryMember<Q>`, one query of a `ServiceClient` resource (`pricing.price.quote`): `call(input)` resolves
 *          the decoded answer now.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4: call).
 */
import type { CallOptions } from "#core/types/call-options.type";
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";

/** A query a service client calls. */
export interface QueryMember<Q extends QueryRef> {
  /**
   * Calls the query and resolves its answer.
   *
   * @throws ClientError the producer's refusal, or a `TransportError`.
   */
  call(input: RefInput<Q>, options?: CallOptions): Promise<RefOutput<Q>>;
}
