/**
 * Stackra file contract:
 * Purpose: `ExpoAppLockDriver`, the `AppLock` driver of the Expo (phone) target: Face ID, Touch ID or the Android
 *          biometric prompt through expo-local-authentication, with the device passcode as the fallback.
 * Boundary: device only, and concrete: it imports expo-local-authentication itself (an optional peer the app adds to
 *           its own dependencies, with its config plugin for the Face ID usage text). The enrolled security level
 *           decides availability: a passcode counts only when `allowPasscode` is true. The constructor takes nothing.
 * Runtime: react-native
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0478 (Expo's own libraries, no hand-written native code).
 */
import { Driver } from "@stackra/container";
import * as LocalAuthentication from "expo-local-authentication";

import { AppLock } from "#contracts/ports/app-lock.port";

/**
 * The app lock check on a phone.
 *
 * @example
 * { provide: AppLock, useClass: ExpoAppLockDriver }
 */
export class ExpoAppLockDriver extends Driver(AppLock) {
  /** Whether an enrolled biometric, or a passcode when allowed, can prove the owner. */
  async canAuthenticate(allowPasscode: boolean): Promise<boolean> {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    const needed = allowPasscode
      ? LocalAuthentication.SecurityLevel.SECRET
      : LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK;
    return level >= needed;
  }

  /** Shows the OS prompt; the passcode is offered only when `allowPasscode` is true. */
  async authenticate(reason: string, allowPasscode: boolean): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      disableDeviceFallback: !allowPasscode,
    });
    return result.success;
  }
}
