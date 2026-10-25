/**
 * Stackra file contract:
 * Purpose: `Role`, the kind base of a module's system role: `class OrderClerkRole extends Role({ grants:
 *          [OrderPermissions.read, OrderPermissions.cancel] }) {}` in a module's `access/<name>.role.ts`. The interface
 *          of the same name is its instance side.
 * Boundary: called only (`grants` is required). The call checks and records its options in the kind registry; the
 *           role's key (`orders.order_clerk`) is derived by gen and reaches the runtime through `registerRoles`, which
 *           turns the grants into permission keys. Shipped roles are versioned and read-only; tenants add custom roles
 *           as data in the policy snapshot. A grant of a system permission is refused here as gen refuses it.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 2 and the 0294 note); ADR 0294 (decisions 16 and 25); ADR 0305 (rules 2 and
 *                     3).
 */
import { createKind } from "@stackra/container";

import type { RoleOptions } from "#core/types/role-options.type";
import { Permission } from "#core/values/permission.value";

/** The instance side of every role class. */
export interface Role {
  /** Type-only kind brand, so a class of another kind cannot stand in for a role. */
  readonly "~kind": "role";
}

/**
 * Checks `options`: at least one grant, each a `Permission` static, none a system permission.
 *
 * @throws TypeError when `grants` is empty, holds a value that is not a `Permission`, or holds a system permission.
 */
function readRoleOptions(options: RoleOptions): Readonly<Record<string, unknown>> {
  const grants: readonly unknown[] = Array.isArray(options?.grants) ? options.grants : [];
  if (grants.length === 0)
    throw new TypeError("Role({ grants }) names at least one permission static");
  for (const grant of grants) {
    if (!(grant instanceof Permission))
      throw new TypeError("Role({ grants }) takes <Model>Permissions statics (Permission values)");
    if (grant.isSystem)
      throw new TypeError(
        "Role({ grants }) cannot grant a system permission: only the platform holds it",
      );
  }
  return { grants: Object.freeze([...grants]) };
}

/**
 * The role kind base.
 *
 * @example
 * export class OrderClerkRole extends Role({
 *   grants: [OrderPermissions.read, OrderPermissions.create, OrderPermissions.cancel],
 * }) {}
 */
export const Role = createKind(
  "role",
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: createKind needs a class; a role holds no state
  class RoleBase {},
  readRoleOptions,
) as (options: RoleOptions) => new () => Role;
