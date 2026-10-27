/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/identity (`fakeSession` with its `SessionFake` and
 *          options, `fakeIdentity`, and the verification-driver harness
 *          `runVerificationCase` with its case types) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; test code only. No other package's `./testing` (ADR 0269
 *           decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { fakeIdentity } from "#testing/functions/fake-identity.function";
export { fakeSession } from "#testing/functions/fake-session.function";
export { runVerificationCase } from "#testing/functions/run-verification-case.function";
export { SessionFake } from "#testing/session.fake";
export type { FakeSessionOptions } from "#testing/types/fake-session-options.type";
export type { VerificationCaseResult } from "#testing/types/verification-case-result.type";
export type { VerificationCase } from "#testing/types/verification-case.type";
