/**
 * Stackra file contract:
 * Purpose: `registerPermissions`, how gen's generated entry tells the runtime the locked key of every `Permission`
 *          static of every permission set the member hosts or consumes.
 * Boundary: writes the process-wide registry; a later row for a key replaces the earlier one. Checks each row against
 *           its class, so a drifted catalogue fails at boot rather than on the first call: every key names a
 *           `Permission` static, every such static has a key, and each key is `<module>.<model>.<verb>` in
 *           snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22); ADR 0132 (decision 2); the actions precedent
 *                     (`registerActions`).
 */
import { kindOf } from "@stackra/container";

import { PERMISSION_REGISTRY } from "#core/constants/permission-registry.constant";
import type { PermissionRegistration } from "#core/types/permission-registration.type";
import { Permission } from "#core/values/permission.value";

/** `<module>.<model>.<verb>`, each segment snake_case. */
const KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * Registers the locked keys of permission statics.
 *
 * @throws TypeError when a row's class is not a permission set, a key is malformed or names no `Permission` static, or
 *         a `Permission` static has no key.
 * @example
 * registerPermissions([
 *   { type: OrderPermissions, keys: { read: "orders.order.read", cancel: "orders.order.cancel" } },
 * ]);
 */
export function registerPermissions(rows: readonly PermissionRegistration[]): void {
  for (const { type, keys } of rows) {
    if (kindOf(type)?.kind !== "permissions")
      throw new TypeError(`registerPermissions: ${type.name} does not extend Permissions`);
    const statics = Object.entries(Object.getOwnPropertyDescriptors(type)).filter(
      ([, descriptor]) => descriptor.value instanceof Permission,
    );
    for (const [verb] of statics)
      if (keys[verb] === undefined)
        throw new TypeError(`registerPermissions: ${type.name}.${verb} has no locked key`);
    for (const [verb, key] of Object.entries(keys)) {
      const permission: unknown = Reflect.get(type, verb);
      if (!(permission instanceof Permission))
        throw new TypeError(`registerPermissions: ${type.name}.${verb} is not a Permission static`);
      if (!KEY.test(key))
        throw new TypeError(`registerPermissions: "${key}" is not a <module>.<model>.<verb> key`);
      PERMISSION_REGISTRY.set(key, permission);
    }
  }
}
