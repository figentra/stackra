/**
 * Stackra file contract:
 * Purpose: `remoteAction`, the descriptor of a producer's action in a service's generated client
 *          (`export const AuthorizePaymentAction = remoteAction("payments.payment.authorize@1", {...})`), which a
 *          `ServiceClient` member wraps and a test fakes with `fake.on(AuthorizePaymentAction)`.
 * Boundary: the service form of `actionRef`: `endpoint` names the route that `actionRef` calls `http`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3, 4 and 6).
 */
import { actionRef } from "#core/functions/action-ref.function";
import type { ActionRef } from "#core/types/action-ref.type";
import type { RefSchema } from "#core/types/ref-schema.type";
import type { RemoteCallOptions } from "#core/types/remote-call-options.type";
import type { SchemaOf } from "#core/types/schema-of.type";

/**
 * A producer's action descriptor.
 *
 * @throws RangeError when `key` is not a call key.
 * @example
 * export const VoidPaymentAction = remoteAction("payments.payment.void@1", {
 *   input: VoidPaymentInput$,
 *   output: VoidPaymentInput$,
 *   endpoint: { method: HttpMethod.Put, path: "/payments/:paymentId/void" },
 * });
 */
export function remoteAction<I extends RefSchema, O extends RefSchema>(
  key: string,
  options: RemoteCallOptions<I, O>,
): ActionRef<SchemaOf<I>, SchemaOf<O>> {
  const { endpoint, ...schemas } = options;
  return actionRef(key, endpoint === undefined ? schemas : { ...schemas, http: endpoint });
}
