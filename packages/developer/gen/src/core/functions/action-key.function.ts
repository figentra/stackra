/**
 * Stackra file contract:
 * Purpose: `actionKey`, the locked identity of an action or a query: the module key, the written `key` and the major
 *          version (`orders.order.cancel@1`).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: action or query key).
 */

/**
 * The identity of an action or query.
 *
 * @param module - the module key.
 * @param key - the written key (`order.cancel`).
 * @param version - the major version; 1 unless `version:` is given.
 * @example
 * actionKey("orders", "order.cancel"); // "orders.order.cancel@1"
 */
export function actionKey(module: string, key: string, version = 1): string {
  return `${module}.${key}@${version}`;
}
