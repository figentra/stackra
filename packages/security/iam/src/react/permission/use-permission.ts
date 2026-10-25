/**
 * Stackra file contract:
 * Purpose: `usePermission()`, the hook a component or a generated navigation shows or hides a control with: a `can`
 *          function over the `PermissionSnapshotService` of the nearest container, re-rendering when the snapshot
 *          changes (`can(OrderPermissions.read)`).
 * Boundary: presentation only: the producer's pipeline checks every call. Reads through `useSyncExternalStore` with
 *           the service's own state on the server too, so a page rendered for a signed-in session hides the same
 *           controls on both sides. Touches no platform API, so web and native share it. Throws outside a
 *           `ContainerProvider` or when the container does not bind the service, so a missing IAM context is never a
 *           silent default. The returned function changes identity when the snapshot changes.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 6); ADR 0273 (presentation roles never grant); ADR 0294 (decision 17); ADR
 *                     0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useCallback, useSyncExternalStore } from "react";

import { PermissionSnapshotService } from "#core/index";
import type { Permission } from "#core/index";

/**
 * A `can` function over the held permissions.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `PermissionSnapshotService`.
 * @example
 * const can = usePermission();
 * return can(OrderPermissions.create) ? <NewOrderButton /> : null;
 */
export function usePermission(): (permission: Permission | string) => boolean {
  const snapshot = useContainer().get(PermissionSnapshotService);
  const keys = useSyncExternalStore(snapshot.subscribe, snapshot.current, snapshot.current);
  return useCallback(
    (permission: Permission | string) => snapshot.can(permission, keys),
    [snapshot, keys],
  );
}
