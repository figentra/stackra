/**
 * Stackra file contract:
 * Purpose: `ExpoPermissionResponse`, an Expo permission response as expo-camera, expo-location and expo-media-library
 *          return it, the slice `ExpoSystemPermissionsDriver` reads.
 * Boundary: a type only, so this package needs none of those libraries installed.
 * Runtime: react-native
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0478.
 */

/** An Expo permission response, as every Expo library returns it. */
export interface ExpoPermissionResponse {
  /** Whether the permission is granted. */
  readonly granted: boolean;
  /** `granted`, `denied` or `undetermined`. */
  readonly status: string;
  /** Whether the OS will still show its prompt; `false` once the person refused for good. */
  readonly canAskAgain: boolean;
}
