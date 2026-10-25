/**
 * Stackra file contract:
 * Purpose: `permissionsRef`, the base gen writes a producer's permission set class over
 *          (`class OrderPermissions extends permissionsRef("orders.order", ["create", "read", "cancel"]) {}`): one
 *          static per verb holding the full permission (`OrderPermissions.read` is `orders.order.read`).
 * Boundary: names only; whether the session holds one is `ClientSession.can`, and the producer's pipeline still checks
 *           every call.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20); ADR 0208 (permission names); owner decision R-56.
 */
import { defineStatics } from "#core/functions/define-statics.function";
import type { PermissionsRef } from "#core/types/permissions-ref.type";

/** `<module>.<model>`, dotted snake_case. */
const PREFIX = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

/** A snake_case verb. */
const VERB = /^[a-z][a-z0-9_]*$/;

/**
 * A consumed permission set class.
 *
 * @throws RangeError when `prefix` or a verb is not snake_case.
 * @example
 * export class OrderPermissions extends permissionsRef("orders.order", ["create", "read", "cancel"]) {}
 * OrderPermissions.cancel; // "orders.order.cancel"
 */
export function permissionsRef<const P extends string, const V extends readonly string[]>(
  prefix: P,
  verbs: V,
): PermissionsRef<P, V[number]> {
  if (!PREFIX.test(prefix))
    throw new RangeError(`"${prefix}" is not a permission prefix: <module>.<model>`);
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a ref is read by its statics only
  const Ref = class {};
  const statics: Record<string, string> = { prefix };
  for (const verb of verbs) {
    if (!VERB.test(verb)) throw new RangeError(`"${verb}" is not a permission verb: snake_case`);
    statics[verb] = `${prefix}.${verb}`;
  }
  defineStatics(Ref, statics);
  return Ref as unknown as PermissionsRef<P, V[number]>;
}
