/**
 * Stackra file contract:
 * Purpose: `useCan()`, the panel's permission check for a spec's `permission`: a function true while the signed-in
 *          principal holds the key, re-rendering when the permission snapshot changes.
 * Boundary: reads `@stackra/iam`'s `PermissionSnapshotService` from the nearest container; a container that binds none
 *           allows every key, so a host without IAM shows every button and the server still decides each run. Hiding a
 *           button is a convenience, never the check.
 * Runtime: browser
 * Governing contract: ADR 0208 (permission names); ADR 0307 (rule 4: the permission is the action key's); the SDUI
 *                     catalogue case `actionButton` (STA-1981).
 */
import { useContainer } from "@stackra/container/react";
import { PermissionSnapshotService } from "@stackra/iam";
import { useCallback, useSyncExternalStore } from "react";

/** No keys, for a container without a snapshot. */
const NONE: readonly string[] = Object.freeze([]);

/** Reads no keys. */
const NO_KEYS = () => NONE;

/** Subscribes to nothing. */
const IDLE = () => () => undefined;

/**
 * Whether the signed-in principal holds a permission key; an absent key is held.
 *
 * @throws Error outside a `ContainerProvider`.
 * @example
 * const can = useCan();
 * if (!can(spec.permission)) return null;
 */
export function useCan(): (permission: string | undefined) => boolean {
  const container = useContainer();
  const snapshot = container.has(PermissionSnapshotService)
    ? container.get(PermissionSnapshotService)
    : undefined;
  const keys = useSyncExternalStore(
    snapshot?.subscribe ?? IDLE,
    snapshot?.current ?? NO_KEYS,
    snapshot?.current ?? NO_KEYS,
  );
  return useCallback(
    (permission: string | undefined) =>
      permission === undefined || snapshot === undefined || snapshot.can(permission, keys),
    [snapshot, keys],
  );
}
