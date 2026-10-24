/**
 * Stackra file contract:
 * Purpose: `PushPermission`, what `usePushPermission()` returns on a target with push: where the permission stands,
 *          the call that asks for it and the one that opens the OS settings, for the settings page's switch.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (decision 3).
 */
import type { PermissionStatus } from "#contracts/types/permission-status.type";

/** The push permission as the settings switch needs it. */
export interface PushPermission {
  /** Where the permission stands; `prompt` until the first read resolves. */
  readonly status: PermissionStatus;

  /** True once the permission is granted. */
  readonly isGranted: boolean;

  /** Asks for the permission; resolves where it stands afterwards. */
  request(): Promise<PermissionStatus>;

  /** Opens the OS settings page of the app, where a denied permission is granted again. */
  openSettings(): Promise<void>;
}
