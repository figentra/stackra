/**
 * Stackra file contract:
 * Purpose: `Can`, the IAM kit's on-screen permission check: renders its children while the signed-in session holds
 *          the permission (all or any of several), and `fallback` otherwise. It re-renders when the snapshot changes.
 * Boundary: presentation only, over `usePermission` (the container's `PermissionSnapshotService`); the producer's
 *           pipeline still checks every call, so hiding a control never replaces the server's refusal. Draws no element
 *           of its own and touches no platform API, so web and native share it. Throws where `usePermission` throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0504 (module UI kits); ADR 0208 (decision 6); ADR 0273 (presentation roles never grant).
 */
import type { ReactElement } from "react";

import type { CanProps } from "#react/can/can.props";
import { usePermission } from "#react/permission/use-permission";

/**
 * Shows its children only while the permission is held.
 *
 * @example
 * <Can permission={OrderPermissions.create} fallback={<Text tone="muted">{labels.noAccess}</Text>}>
 *   <NewOrderButton />
 * </Can>
 */
export function Can({ permission, mode = "all", children, fallback }: CanProps): ReactElement {
  const can = usePermission();
  const keys = [permission].flat();
  const isAllowed = mode === "any" ? keys.some(can) : keys.every(can);
  return <>{isAllowed ? children : fallback}</>;
}
