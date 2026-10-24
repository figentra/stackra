/**
 * Stackra file contract:
 * Purpose: `ActionMember<A>`, one action of a `ServiceClient` resource (`payments.payment.void`): `call(input)` resolves
 *          the answer now; `queue(input)` hands the call to the producer's queue (a queued call) and resolves once it
 *          is accepted.
 * Boundary: a type only. A queued call runs at least once, deduplicated by its Idempotency-Key.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4: call and queued call).
 */
import type { ActionRef } from "#core/types/action-ref.type";
import type { CallOptions } from "#core/types/call-options.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";

/** An action a service client calls or queues. */
export interface ActionMember<A extends ActionRef> {
  /**
   * Calls the action and resolves its answer.
   *
   * @throws ClientError the producer's refusal, or a `TransportError`.
   */
  call(input: RefInput<A>, options?: CallOptions): Promise<RefOutput<A>>;

  /**
   * Queues the action on the producer's queue.
   *
   * @throws ClientError when the producer refuses to queue it, or a `TransportError`.
   */
  queue(input: RefInput<A>, options?: CallOptions): Promise<void>;
}
