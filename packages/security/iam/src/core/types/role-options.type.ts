/**
 * Stackra file contract:
 * Purpose: `RoleOptions`, the options of `Role({ grants })`: the permissions a module's system role holds, named by
 *          their `<Model>Permissions` statics.
 * Boundary: a type only. A system permission (`Permission.Lx.system()`) is never granted to a role, and a role names
 *           explicit statics, never a wildcard; custom roles are a scope's data, not classes.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 2, as amended by 0294); ADR 0132 (decision 5).
 */
import type { Permission } from "#core/values/permission.value";

/** The options of a role class. */
export interface RoleOptions {
  /** The permissions the role holds (`[OrderPermissions.read, OrderPermissions.cancel]`), at least one. */
  readonly grants: readonly Permission[];
}
