/**
 * Stackra file contract:
 * Purpose: `permissionKey`, the locked key of a permission (`orders.order.cancel`), whether it is given as its
 *          `Permission` static or already as its key (a generated client's `OrderPermissions.read`).
 * Boundary: reads the registry `registerPermissions` wrote; the key is derived at build time, so an unregistered static
 *           has none and is refused rather than guessed. A string passes through unchecked: it is already a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: derived identities); ADR 0132 (decision 2).
 */
import { PERMISSION_REGISTRY } from "#core/constants/permission-registry.constant";
import type { Permission } from "#core/values/permission.value";

/**
 * The locked key of `permission`.
 *
 * @throws TypeError when `permission` is a static gen has not registered.
 * @example
 * permissionKey(OrderPermissions.cancel); // "orders.order.cancel"
 */
export function permissionKey(permission: Permission | string): string {
  if (typeof permission === "string") return permission;
  for (const [key, registered] of PERMISSION_REGISTRY) if (registered === permission) return key;
  throw new TypeError(
    "This permission is not registered: gen's entry calls registerPermissions for every permission set",
  );
}
