/**
 * Stackra file contract:
 * Purpose: `PermissionRegistration`, one row gen hands `registerPermissions`: a permission set class with the locked
 *          key of each of its statics (the manifest's permission catalogue).
 * Boundary: a type only. Keys are derived at build time and locked in `stackra.manifest.json` (a rename keeps its old
 *           key through `@Renamed`), so the runtime takes them as given instead of deriving them again.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); ADR 0132 (as amended by 0294).
 */
import type { AnyClass } from "@stackra/container";

import type { Permissions } from "#core/bases/permissions.base";

/** The locked keys of one permission set. */
export interface PermissionRegistration {
  /** The permission set class. */
  readonly type: AnyClass<Permissions>;

  /** Each `Permission` static's name to its locked key (`{ cancel: "orders.order.cancel" }`). */
  readonly keys: Readonly<Record<string, string>>;
}
