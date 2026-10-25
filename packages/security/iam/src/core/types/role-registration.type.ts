/**
 * Stackra file contract:
 * Purpose: `RoleRegistration`, one row gen hands `registerRoles`: a module role class with the key gen derived and
 *          locked in the manifest.
 * Boundary: a type only. The grants are read from the class's own options, so the row carries only what is gone at
 *           runtime: the key, derived from the module folder and the class name.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); ADR 0208 (decision 2, as amended by 0294).
 */
import type { AnyClass } from "@stackra/container";

import type { Role } from "#core/bases/role.base";

/** The derived identity of one module role. */
export interface RoleRegistration {
  /** The role class. */
  readonly type: AnyClass<Role>;

  /** The locked key, `<module>.<name>` (`orders.order_clerk`), which grants name. */
  readonly key: string;
}
