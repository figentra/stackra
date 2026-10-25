/**
 * Stackra file contract:
 * Purpose: `widgetRef`, the base gen writes a producer's widget class over
 *          (`class OrderKpisWidget extends widgetRef("orders.order_kpis", { query: OrderKpisQuery, ... }) {}`): the
 *          widget key, the query it reads and its display options, as statics.
 * Boundary: the display options are kept as declared for `@stackra/panel`; this package reads only `query`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (widgets); ADR 0260 (decision 2).
 */
import { defineStatics } from "#core/functions/define-statics.function";
import type { WidgetRef } from "#core/types/widget-ref.type";
import type { WidgetRefOptions } from "#core/types/widget-ref-options.type";

/** `<module>.<snake_name>`. */
const WIDGET_KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * A consumed widget class.
 *
 * @throws RangeError when `key` is not `<module>.<snake_name>`.
 * @example
 * export class OrderKpisWidget extends widgetRef("orders.order_kpis", {
 *   query: OrderKpisQuery,
 *   size: WidgetSize.Full,
 * }) {}
 */
export function widgetRef<const O extends WidgetRefOptions>(key: string, options: O): WidgetRef<O> {
  if (!WIDGET_KEY.test(key))
    throw new RangeError(`"${key}" is not a widget key: <module>.<snake_name>`);
  const { query, ...display } = options;
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a ref is read by its statics only
  const Ref = class {};
  defineStatics(Ref, { key, query, options: Object.freeze(display) });
  return Ref as unknown as WidgetRef<O>;
}
