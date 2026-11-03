/**
 * Stackra file contract:
 * Purpose: `CanProps`, what a host hands `Can`: the permission keys a part of the screen needs, whether all or any of
 *          them, the content shown when they are held and the content shown when they are not.
 * Boundary: an interface in its own file beside the component (ADR 0305). The held permissions are the container's
 *           `PermissionSnapshotService`, read through `usePermission`, never props.
 * Runtime: isomorphic
 * Governing contract: ADR 0504 (module UI kits); ADR 0208 (decision 6); ADR 0273 (presentation roles never grant);
 *                     ADR 0305.
 */
import type { Permission } from "@stackra/contracts";
import type { ReactNode } from "react";

/**
 * The permission keys and the content to show.
 *
 * @example
 * <Can permission={[OrderPermissions.update, OrderPermissions.cancel]} mode="any" fallback={null}>
 *   <OrderActions />
 * </Can>
 */
export interface CanProps {
  /** The permission key, or keys, the content needs: a key (`orders.order.cancel`) or a permission static. */
  readonly permission: Permission | string | readonly (Permission | string)[];
  /** `all` (the default) needs every key; `any` needs one of them. */
  readonly mode?: "all" | "any" | undefined;
  /** Shown while the permissions are held. */
  readonly children?: ReactNode;
  /** Shown while they are not; nothing by default. */
  readonly fallback?: ReactNode;
}
