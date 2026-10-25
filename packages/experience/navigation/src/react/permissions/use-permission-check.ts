/**
 * Stackra file contract:
 * Purpose: `usePermissionCheck()`, whether the actor holds a permission, as a function `useNavigation` gates entries
 *          with; a new function, and so a re-render, whenever the held permissions change.
 * Boundary: internal; reads `@stackra/iam`'s `PermissionSnapshotService` when the container binds it (its own
 *           `usePermission` throws without one, and a hook cannot be called conditionally), else allows everything:
 *           the server refuses what the actor may not reach either way.
 * Runtime: browser
 * Governing contract: ADR 0214 (gate-filtered navigation); ADR 0208 (IAM).
 */
import { useContainer } from "@stackra/container/react";
import { PermissionSnapshotService } from "@stackra/iam";
import { useCallback, useSyncExternalStore } from "react";

/** No held permissions to watch. */
const NONE: readonly string[] = Object.freeze([]);

/** A subscription that never fires. */
const quiet = (): (() => void) => () => undefined;

/**
 * The actor's permission check.
 *
 * @example
 * const can = usePermissionCheck();
 * const visible = items.filter((item) => item.permission === undefined || can(item.permission));
 */
export function usePermissionCheck(): (permission: string) => boolean {
  const container = useContainer();
  const snapshot = container.has(PermissionSnapshotService)
    ? container.get(PermissionSnapshotService)
    : null;
  const read = snapshot?.current ?? (() => NONE);
  const keys = useSyncExternalStore(snapshot?.subscribe ?? quiet, read, read);
  return useCallback(
    (permission: string) => snapshot === null || snapshot.can(permission, keys),
    [snapshot, keys],
  );
}
