/**
 * Stackra file contract:
 * Purpose: `createPublicClients`, one request's anonymous callers of the gateway's public area for a Worker or a server
 *          render: every call carries the pinned `Stackra-Version`, the request's `Accept-Language` and
 *          `Stackra-Market`, and the facts forwarded from the visitor's request.
 * Boundary: public area only: no session, no token, and any other area is refused when the clients are built. Every
 *           public call is a `GET` or idempotent, so retries follow the transport's safe-to-repeat rule; a refusal the
 *           envelope marks not retryable is never retried. The forwarded facts are awaited once and reused.
 * Runtime: isomorphic
 * Governing contract: ADR 0082 (API areas); ADR 0237 (generated gateway); ADR 0118; ADR 0140; ADR 0260.
 */
import { ApiArea } from "@stackra/contracts";
import { createTransport, retry, stackraVersion } from "@stackra/transport";
import type { Middleware } from "@stackra/transport";

import { clientRequest } from "#core/functions/client-request.function";
import { httpCall } from "#core/functions/http-call.function";
import type { ActionRef } from "#core/types/action-ref.type";
import type { CallOptions } from "#core/types/call-options.type";
import type { CallRef } from "#core/types/call-ref.type";
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";
import { RetryOn } from "#server/enums/retry-on.enum";
import type { PublicClients } from "#server/types/public-clients.type";
import type { PublicClientsOptions } from "#server/types/public-clients-options.type";

/**
 * The public clients of one request.
 *
 * @throws RangeError when `area` is not `ApiArea.Public`, or the retry attempts are not a whole number of at least 1.
 * @example
 * const clients = createPublicClients({ baseUrl: env.apiUrl, area: ApiArea.Public, version: apiVersion });
 * const ladder = await clients.query(ListPlansQuery, { product: "stackra" });
 */
export function createPublicClients(options: PublicClientsOptions): PublicClients {
  if (options.area !== ApiArea.Public)
    throw new RangeError(
      `Public clients call the public area only, not "${options.area}": another area needs a session and the HTTP transport driver`,
    );
  const middleware: Middleware[] = [];
  if (options.version !== undefined) middleware.push(stackraVersion(options.version));
  if (options.retry !== undefined)
    middleware.push(
      retry({ attempts: options.retry.attempts, refused: options.retry.on === RetryOn.Retryable }),
    );
  const transport = createTransport({ middleware });
  const headers: Record<string, string> = {};
  if (options.locale !== undefined) headers["Accept-Language"] = options.locale;
  if (options.market !== undefined) headers["Stackra-Market"] = options.market;
  const forwarded = Promise.resolve(options.forward ?? {});
  // Marks the promise handled; a failure still rejects every call that awaits it.
  forwarded.catch(() => undefined);
  const call = async (ref: CallRef, input: unknown, callOptions?: CallOptions) =>
    httpCall(clientRequest(ref, input, callOptions), {
      baseUrl: options.baseUrl,
      transport,
      headers: { ...(await forwarded), ...headers },
    });
  // The transport decodes each answer with the ref's output schema.
  return Object.freeze({
    query: <Q extends QueryRef>(query: Q, input: RefInput<Q>, callOptions?: CallOptions) =>
      call(query, input, callOptions) as Promise<RefOutput<Q>>,
    action: <A extends ActionRef>(action: A, input: RefInput<A>, callOptions?: CallOptions) =>
      call(action, input, callOptions) as Promise<RefOutput<A>>,
  });
}
