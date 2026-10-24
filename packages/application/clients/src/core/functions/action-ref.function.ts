/**
 * Stackra file contract:
 * Purpose: `actionRef`, the base gen writes a consumed action class over in `#stackra/clients/<service>`
 *          (`class CancelOrderAction extends actionRef("orders.order.cancel@1", {...}) {}`): the versioned key, the
 *          derived permission, the input and output schemas, the route, the risk and the texts, as statics.
 * Boundary: the ref describes the call; a transport makes it. Each ref is recorded by key so the mutation queue can
 *           replay a queued call. `confirm` and `success` at the top level merge into `texts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3 and 4); ADR 0294 (decision 20); ADR 0261; ADR 0059.
 */
import { CALL_REFS } from "#core/constants/call-refs.constant";
import { defineStatics } from "#core/functions/define-statics.function";
import { permissionOf } from "#core/functions/permission-of.function";
import { resolveSchema } from "#core/functions/resolve-schema.function";
import type { ActionRef } from "#core/types/action-ref.type";
import type { ActionRefOptions } from "#core/types/action-ref-options.type";
import type { RefSchema } from "#core/types/ref-schema.type";
import type { SchemaOf } from "#core/types/schema-of.type";

/**
 * A consumed action class.
 *
 * @throws RangeError when `key` is not a call key.
 * @throws TypeError when the input or output is neither a zod schema nor a remote shape class.
 * @example
 * export class CancelOrderAction extends actionRef("orders.order.cancel@1", {
 *   input: CancelOrderInput,
 *   output: CancelOrderOutput,
 *   http: { method: HttpMethod.Put, path: "/orders/:orderId/cancel" },
 *   risk: Risk.L2,
 *   confirm: I18n.orders.actions.order.cancel.confirm,
 * }) {}
 */
export function actionRef<I extends RefSchema, O extends RefSchema>(
  key: string,
  options: ActionRefOptions<I, O>,
): ActionRef<SchemaOf<I>, SchemaOf<O>> {
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a ref is read by its statics only
  const Ref = class {};
  defineStatics(Ref, {
    kind: "action",
    key,
    permission: permissionOf(key),
    input: resolveSchema(options.input),
    output: resolveSchema(options.output),
    endpoint: options.http,
    risk: options.risk,
    texts: Object.freeze({
      ...options.texts,
      ...(options.confirm === undefined ? {} : { confirm: options.confirm }),
      ...(options.success === undefined ? {} : { success: options.success }),
    }),
  });
  const ref = Ref as unknown as ActionRef<SchemaOf<I>, SchemaOf<O>>;
  CALL_REFS.set(key, ref);
  return ref;
}
