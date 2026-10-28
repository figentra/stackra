/**
 * Stackra file contract:
 * Purpose: `runAction`, one run of an action from a client: sends it, then invalidates the queries it changes; when the
 *          network is down and the offline map lets the queue hold the action, queues it instead.
 * Boundary: internal to `useAction`; not exported from an entry. A call is queued only after a network failure, never
 *           after a refusal; the queued call keeps the wire input and is ordered behind the earlier calls on the record
 *           its route names (the first `:param`). An online-only action rethrows the network error; a capped action
 *           past its offline cap rejects with the queue's `offline_cap_reached`. An invalid input is refused before
 *           anything is sent.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (offline queue); ADR 0227 (no sync engine); ADR 0260 (decision 4).
 */
import { isRefusal } from "@stackra/errors";
import { OfflineError } from "@stackra/query";
import type { MutationQueue } from "@stackra/query";
import type { QueryClient } from "@tanstack/query-core";

import { TransportFailure } from "#contracts/enums/transport-failure.enum";
import type { ClientTransport } from "#contracts/ports/client-transport.port";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { TransportError } from "#core/errors/transport.error";
import { clientRequest } from "#core/functions/client-request.function";
import type { ActionRef } from "#core/types/action-ref.type";
import type { ActionResult } from "#core/types/action-result.type";
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";

/** What a run uses. */
interface ActionRuntime {
  /** Sends the call. */
  readonly transport: ClientTransport;

  /** Holds the call while offline; absent when the host binds no queue. */
  readonly queue?: MutationQueue;

  /** The query cache whose results the call makes stale. */
  readonly client?: QueryClient;

  /** The queries whose cached results are stale after a sent call. */
  readonly invalidates?: readonly QueryRef[];
}

/** The record the call changes: the value of the route's first `:param`, when it has one. */
function aggregateOf(request: ClientRequest): string | undefined {
  const name = /:([A-Za-z][A-Za-z0-9]*)/.exec(request.endpoint?.path ?? "")?.[1];
  const input = request.input;
  if (name === undefined || typeof input !== "object" || input === null || Array.isArray(input))
    return undefined;
  const value = input[name];
  return typeof value === "string" ? value : undefined;
}

/**
 * Runs `action` with `input`.
 *
 * @throws InputInvalidError when `input` does not match the action's input schema.
 * @throws ClientError the producer's refusal, the `TransportError` when the call can neither be sent nor queued, or
 *         `@stackra/actions`' `OfflineCapReachedError` when the queue refuses it past its offline cap.
 * @throws Error the queue's write error; the call is then neither sent nor queued.
 */
export async function runAction<A extends ActionRef>(
  runtime: ActionRuntime,
  action: A,
  input: RefInput<A>,
): Promise<ActionResult<RefOutput<A>>> {
  const request = clientRequest(action, input);
  let data: unknown;
  try {
    data = await runtime.transport.send(request);
  } catch (error) {
    const isOffline = isRefusal(error, TransportError) && error.reason === TransportFailure.Network;
    if (!isOffline || runtime.queue === undefined) throw error;
    try {
      await runtime.queue.enqueue(action, request.input, aggregateOf(request));
    } catch (refusedError) {
      if (isRefusal(refusedError, OfflineError)) throw error;
      throw refusedError;
    }
    return { queued: true };
  }
  const client = runtime.client;
  if (client !== undefined)
    await Promise.all(
      (runtime.invalidates ?? []).map((query) =>
        client.invalidateQueries({ queryKey: [query.key] }),
      ),
    );
  // The transport decoded the answer with the action's output schema.
  return { queued: false, data: data as RefOutput<A> };
}
