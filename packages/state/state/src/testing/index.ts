/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/state (`createStore`, `mountStore`, the `MountedStore`
 *          type) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The memory storage stays internal: a test that needs its own
 *           storage passes `@stackra/storage/testing`'s `fakeStorage()`. Imports `.` only (ADR 0269 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { createStore } from "#testing/functions/create-store.function";
export { mountStore } from "#testing/functions/mount-store.function";
export type { MountedStore } from "#testing/types/mounted-store.type";
