/**
 * Stackra file contract:
 * Purpose: `AndroidPermission`, one `uses-permission` entry the plugin adds to the Android manifest: its name and,
 *          for a legacy Bluetooth permission, the last SDK level that needs it.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2).
 */

/** A manifest permission. */
export interface AndroidPermission {
  /** The permission name (`android.permission.BLUETOOTH_CONNECT`). */
  readonly name: string;
  /** The highest SDK level that needs it, or undefined for every level. */
  readonly maxSdkVersion?: number;
}
