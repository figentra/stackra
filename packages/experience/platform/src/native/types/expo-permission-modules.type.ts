/**
 * Stackra file contract:
 * Purpose: `ExpoPermissionModules`, the Expo libraries `ExpoDevicePermissionsDriver` asks through, as the host app's
 *          subclass hands them over: expo-camera (camera and microphone), expo-location and expo-media-library.
 * Boundary: a type only, the slice of each library the driver calls, so this package needs none of them installed; the
 *           app depends on the ones it uses (an Expo module must be the app's own dependency to be linked). `null`
 *           means the app does not ship that library, and its permissions read `denied`.
 * Runtime: react-native
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0478 (Expo's own libraries, no hand-written native code).
 */
import type { ExpoPermissionResponse } from "#native/types/expo-permission-response.type";

/** Reads or asks for one Expo permission. */
type Ask = () => Promise<ExpoPermissionResponse>;

/**
 * The Expo libraries device permissions are asked through.
 *
 * @example
 * import { Camera } from "expo-camera";
 * import * as Location from "expo-location";
 * import * as MediaLibrary from "expo-media-library";
 *
 * const modules: ExpoPermissionModules = { camera: Camera, location: Location, mediaLibrary: MediaLibrary };
 */
export interface ExpoPermissionModules {
  /** expo-camera's `Camera`, for the camera and the microphone. */
  readonly camera: {
    /** Where the camera permission stands. */
    readonly getCameraPermissionsAsync: Ask;
    /** Prompts for the camera. */
    readonly requestCameraPermissionsAsync: Ask;
    /** Where the microphone permission stands. */
    readonly getMicrophonePermissionsAsync: Ask;
    /** Prompts for the microphone. */
    readonly requestMicrophonePermissionsAsync: Ask;
  } | null;

  /** expo-location, for location while the app is in use. */
  readonly location: {
    /** Where the foreground location permission stands. */
    readonly getForegroundPermissionsAsync: Ask;
    /** Prompts for foreground location. */
    readonly requestForegroundPermissionsAsync: Ask;
  } | null;

  /** expo-media-library, for the photo library. */
  readonly mediaLibrary: {
    /** Where the photo library permission stands. */
    readonly getPermissionsAsync: Ask;
    /** Prompts for the photo library. */
    readonly requestPermissionsAsync: Ask;
  } | null;
}
