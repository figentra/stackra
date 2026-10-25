/**
 * Stackra file contract:
 * Purpose: `PermissionSnapshotService`, the client's UI permissions snapshot: the permission keys the signed-in
 *          principal holds in the active scope, which `usePermission` reads to show or hide a control.
 * Boundary: cosmetic only: hiding a button never secures anything, and the producer's pipeline checks every call. It
 *           computes nothing: the session's owner (the identity package) sets the keys the IAM service computed, and
 *           sets them again on a scope switch or a policy change. Starts empty, so nothing shows before the session
 *           sets it. A held entry may be a wildcard (`orders.*`, `*`).
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 6: permission names); ADR 0132 (decision 5); ADR 0294 (decision 17).
 */
import { Service } from "@stackra/container";

import { coversPermission } from "#core/functions/covers-permission.function";
import { permissionKey } from "#core/functions/permission-key.function";
import type { Permission } from "#core/values/permission.value";

/**
 * The held permission keys, as a store `useSyncExternalStore` reads.
 *
 * @example
 * container.get(PermissionSnapshotService).set(session.permissions);
 */
export class PermissionSnapshotService extends Service {
  /** The held keys, frozen. */
  private keys: readonly string[] = Object.freeze([]);

  /** Who to call after a change. */
  private readonly listeners = new Set<() => void>();

  /** The held keys; the same array until they change, so it is the snapshot `useSyncExternalStore` compares. */
  readonly current = (): readonly string[] => this.keys;

  /**
   * Calls `listener` after every change; the shape `useSyncExternalStore` takes.
   *
   * @returns removes the listener; safe to call twice.
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    const entry = () => listener();
    this.listeners.add(entry);
    return () => {
      this.listeners.delete(entry);
    };
  };

  /** Replaces the held keys and notifies subscribers. */
  readonly set = (keys: readonly string[]): void => {
    this.keys = Object.freeze([...keys]);
    // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
    for (const listener of [...this.listeners]) listener();
  };

  /**
   * Whether `keys` (the held keys by default) cover `permission`.
   *
   * @throws TypeError when `permission` is a static gen has not registered.
   */
  readonly can = (
    permission: Permission | string,
    keys: readonly string[] = this.keys,
  ): boolean => {
    const key = permissionKey(permission);
    return keys.some((held) => coversPermission(held, key));
  };
}
