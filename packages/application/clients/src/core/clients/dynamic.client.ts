/**
 * Stackra file contract:
 * Purpose: `DynamicClient`, the service client of a call known only at runtime: `call` and `queue` a registered key and
 *          route (`DynamicCall`) with JSON input, over the same `ClientTransport` as a generated client, so the
 *          producer's base URL (`ClientsOptions.producers`) and the call's scope (`CallOptions.scope`) resolve the same.
 * Boundary: a `ServiceClient`, so it is its own token and a test replaces it with `fakeClient()`. No schema is known,
 *           so the input travels as given and the answer resolves undecoded (`unknown`); the caller validates it. The
 *           ref built per call is never registered, so a dynamic key is never a generated ref.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3, 4 and 6, and the 2026-10-26 note on dynamic keys); ADR 0263 (DI).
 */
import type { Json } from "@stackra/contracts";
import { z } from "zod";

import { ServiceClient } from "#core/bases/service-client.base";
import type { ActionRef } from "#core/types/action-ref.type";
import type { CallOptions } from "#core/types/call-options.type";
import type { DynamicCall } from "#core/types/dynamic-call.type";

/** The unregistered ref of `target`: JSON in, the answer as it came. */
function dynamicRef(target: DynamicCall): ActionRef {
  return Object.freeze({
    kind: target.kind,
    key: target.key,
    input: z.unknown(),
    output: z.unknown(),
    endpoint: target.endpoint,
  }) as unknown as ActionRef;
}

/**
 * Calls registered keys.
 *
 * @example
 * const rows = await this.dynamic.call(target, { rows }, { scope: job.scopePath, idempotencyKey: ctx.stepKey });
 */
export class DynamicClient extends ServiceClient {
  /**
   * Makes the call and resolves its answer, undecoded.
   *
   * @throws ClientError the producer's refusal, or the transport's error.
   */
  call(target: DynamicCall, input: Json, options?: CallOptions): Promise<unknown> {
    return this.member(dynamicRef(target)).call(input, options);
  }

  /**
   * Hands an action to the producer's queue.
   *
   * @throws TypeError when `target` is a query, which cannot be queued.
   * @throws ClientError when the producer refuses to queue it, or the transport's error.
   */
  async queue(target: DynamicCall, input: Json, options?: CallOptions): Promise<void> {
    if (target.kind !== "action")
      throw new TypeError(`${target.key} is a query: only an action can be queued`);
    await this.member(dynamicRef(target)).queue(input, options);
  }
}
