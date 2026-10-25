/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/transport until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names its one re-export and declares nothing; the pipeline itself is the `.` entry's.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { nativeFetch } from "#native/native-fetch/native-fetch.function";
