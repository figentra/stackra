/**
 * Stackra file contract:
 * Purpose: `PermissionsRef<P, V>`, the class `permissionsRef` returns: a producer's permission set as statics, one per
 *          verb (`OrderPermissions.read` is `orders.order.read`), like the producer's own `<Model>Permissions` class.
 * Boundary: a type only; code names a permission through these statics, never a string literal (R-56).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: permissions `<module>.<model>.<verb>`); ADR 0208; owner decision R-56.
 */

/** A consumed permission set class. */
export type PermissionsRef<
  P extends string = string,
  V extends string = string,
> = (abstract new () => object) & {
  /** The permission prefix (`orders.order`). */
  readonly prefix: P;
} & { readonly [K in V]: `${P}.${K}` };
