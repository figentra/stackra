/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/app (the React Native `createApp` and its types), until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./react` through `#core/*` and `#react/*`.
 * Runtime: react-native
 * Governing contract: ADR 0295 (decision 8); ADR 0294 (decision 15); ADR 0127 2026-10-24 note.
 */
export { createApp } from "#native/functions/create-app.function";
export type { NativeApp } from "#native/types/native-app.type";
export type { NativeAppOptions } from "#native/types/native-app-options.type";
