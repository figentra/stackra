/**
 * Stackra file contract:
 * Purpose: `registerRoles`, how gen's generated entry tells the decision point the locked key of every module role,
 *          whose grants become permission keys here.
 * Boundary: writes the process-wide registry; a later row for a key replaces the earlier one. Reads the grants from
 *           the class's recorded options through `permissionKey`, so `registerPermissions` runs first; a grant gen did
 *           not register fails at boot.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 2, as amended by 0294); ADR 0294 (decisions 20 and 22).
 */
import { kindOf } from "@stackra/container";

import { ROLE_REGISTRY } from "#core/constants/role-registry.constant";
import { permissionKey } from "#core/functions/permission-key.function";
import type { RoleRegistration } from "#core/types/role-registration.type";
import type { Permission } from "#core/values/permission.value";

/** `<module>.<name>`, each segment snake_case. */
const KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * Registers the locked keys of module roles.
 *
 * @throws TypeError when a row's class is not a role, its key is malformed, or one of its grants is not registered.
 * @example
 * registerRoles([{ type: OrderClerkRole, key: "orders.order_clerk" }]);
 */
export function registerRoles(rows: readonly RoleRegistration[]): void {
  for (const { type, key } of rows) {
    const record = kindOf(type);
    if (record?.kind !== "role")
      throw new TypeError(`registerRoles: ${type.name} does not extend Role({ grants })`);
    if (!KEY.test(key))
      throw new TypeError(`registerRoles: "${key}" is not a <module>.<name> role key`);
    // `Role` records `grants` as checked Permission statics.
    const grants = record.options["grants"] as readonly Permission[];
    ROLE_REGISTRY.set(key, Object.freeze(grants.map((grant) => permissionKey(grant))));
  }
}
