/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/access-log (`AccessLogSinkFake`, `AccessLogEntryFactory`
 *          and the `toHaveLoggedAccess` matcher with its options type) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing; importing it registers the matcher, and `sideEffects` stays
 *           `false` because only tests load `./testing` and never tree-shake it. The only entry that exports a factory,
 *           so Faker never reaches a runtime entry (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { AccessLogEntryFactory } from "#node/database/factories/access-log-entry.factory";
export { AccessLogSinkFake } from "#testing/access-log-sink.fake";
export { toHaveLoggedAccess } from "#testing/to-have-logged-access.matcher";
export type { ToHaveLoggedAccessOptions } from "#testing/to-have-logged-access-options.type";
