/**
 * Stackra file contract:
 * Purpose: `Permissions`, the kind base of a model's permission set: `class OrderPermissions extends Permissions` in a
 *          module's `access/<model>.permissions.ts`, with one `static readonly <verb> = Permission.Lx` per verb.
 * Boundary: bare only (no options), registered as the `permissions` kind. Statics only: the class is never
 *           constructed. Each key (`orders.order.cancel`) is derived by gen from the module, the class name minus
 *           `Permissions` and the static, and reaches the runtime through `registerPermissions`.
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (as amended by 0294); ADR 0294 (decisions 16 and 20); ADR 0208 (decision 6).
 */
import { registerKind } from "@stackra/container";

/**
 * The permission set kind base.
 *
 * @example
 * export class OrderPermissions extends Permissions {
 *   static readonly read = Permission.L0;
 *   static readonly cancel = Permission.L2;
 * }
 */
export abstract class Permissions {
  /** Type-only kind brand, so a class of another kind cannot stand in for a permission set. */
  declare protected readonly "~kind": "permissions";
}

registerKind(Permissions, "permissions");
