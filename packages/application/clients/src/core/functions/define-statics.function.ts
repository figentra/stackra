/**
 * Stackra file contract:
 * Purpose: `defineStatics`, sets a ref class's statics as read-only, enumerable properties, leaving out the ones whose
 *          value is `undefined` so an optional static is absent rather than `undefined`.
 * Boundary: internal to the ref factories; not exported from an entry. Subclasses inherit the statics through the
 *           constructor's prototype chain.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3).
 */

/**
 * Defines `statics` on `type`.
 *
 * @example
 * defineStatics(Ref, { kind: "action", key: "orders.order.cancel@1", risk: undefined }); // no `risk` static
 */
export function defineStatics(type: object, statics: Readonly<Record<string, unknown>>): void {
  for (const [name, value] of Object.entries(statics))
    if (value !== undefined)
      Object.defineProperty(type, name, { value, enumerable: true, configurable: false });
}
