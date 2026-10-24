/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/media (`fakeUpload` and the `FakeUpload` it returns)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports this package's entries and `@stackra/container/testing`
 *           for the testing app's type only; no other package's `./testing` code (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { fakeUpload } from "#testing/functions/fake-upload.function";
export type { FakeUpload } from "#testing/types/fake-upload.type";
