/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/identity (`ExpoSignInBrowserDriver`, `ExpoPasskeysDriver`, `ExpoAppleSignInDriver`, and
 *          `useAppApprovalSheet`, the app's approve sheet) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. React Native only: it imports `expo-linking`,
 *           `expo-web-browser` and `react-native-passkey`, optional peers a mobile app installs;
 *           `ExpoAppleSignInDriver` requires `expo-apple-authentication` only when used (STA-1578).
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); ADR 0206 (decision 8); the STA-347 stand-in barrel decision.
 */
export type { AppApprovalSheet } from "#native/app-approval/app-approval-sheet.type";
export type { AppApprovalSheetOptions } from "#native/app-approval/app-approval-sheet-options.type";
export { useAppApprovalSheet } from "#native/app-approval/use-app-approval-sheet";
export { ExpoAppleSignInDriver } from "#native/drivers/expo-apple-sign-in.driver";
export { ExpoPasskeysDriver } from "#native/drivers/expo-passkeys.driver";
export { ExpoSignInBrowserDriver } from "#native/drivers/expo-sign-in-browser.driver";
