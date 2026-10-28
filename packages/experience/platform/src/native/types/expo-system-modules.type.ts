/**
 * Stackra file contract:
 * Purpose: `ExpoSystemModules`, the Expo libraries `ExpoSystemSettingsDriver` reads the system settings through, as
 *          the host app's subclass hands them over: expo-tracking-transparency, expo-battery and expo-background-task.
 * Boundary: a type only, the slice of each library the driver calls, so this package needs none of them installed; the
 *           app depends on the ones it uses (an Expo module must be the app's own dependency to be linked). `null`
 *           means the app does not ship that library.
 * Runtime: react-native
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0478 (Expo's own libraries, no hand-written native code).
 */

/** An Expo permission response, as every Expo library returns it. */
interface ExpoPermissionResponse {
  /** Whether the permission is granted. */
  readonly granted: boolean;
  /** `granted`, `denied` or `undetermined`. */
  readonly status: string;
}

/**
 * The Expo libraries the system settings are read through.
 *
 * @example
 * import * as BackgroundTask from "expo-background-task";
 * import * as Battery from "expo-battery";
 * import * as TrackingTransparency from "expo-tracking-transparency";
 *
 * const modules: ExpoSystemModules = { trackingTransparency: TrackingTransparency, battery: Battery, backgroundTask: BackgroundTask };
 */
export interface ExpoSystemModules {
  /** expo-tracking-transparency; `null` when the app does not track, which on iOS reads as tracking refused. */
  readonly trackingTransparency: {
    /** Where App Tracking Transparency stands. */
    readonly getTrackingPermissionsAsync: () => Promise<ExpoPermissionResponse>;
    /** Shows the App Tracking Transparency prompt. */
    readonly requestTrackingPermissionsAsync: () => Promise<ExpoPermissionResponse>;
  } | null;

  /** expo-battery; `null` leaves Low Power Mode reading off. */
  readonly battery: {
    /** Whether Low Power Mode is on now. */
    readonly isLowPowerModeEnabledAsync: () => Promise<boolean>;
    /** Calls `listener` when Low Power Mode changes; returns the subscription to remove. */
    readonly addLowPowerModeListener: (
      listener: (event: { readonly lowPowerMode: boolean }) => void,
    ) => { readonly remove: () => void };
  } | null;

  /** expo-background-task; `null` leaves background refresh unanswered (`null`). */
  readonly backgroundTask: {
    /** `BackgroundTaskStatus`: 1 restricted (or refused by the person), 2 available. */
    readonly getStatusAsync: () => Promise<number>;
  } | null;
}
