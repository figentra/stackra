/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/queue (`drainQueue`, `runJob`, the `toDeadLetter`
 *          matcher and the testing-module plugin) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Importing it registers the matcher with `expect` and the plugin
 *           with the testing module; `sideEffects` stays `false` because only vitest loads `./testing` and never
 *           tree-shakes it. Imports `.`, `./contracts`, `./node`, `@stackra/container/testing` and `@stackra/testing`
 *           only; no other package's `./testing` (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { QUEUE_TESTING_PLUGIN } from "#testing/constants/queue-testing-plugin.constant";
export { drainQueue } from "#testing/functions/drain-queue.function";
export { runJob } from "#testing/functions/run-job.function";
export { toDeadLetter } from "#testing/to-dead-letter.matcher";
export type { JobResult } from "#testing/types/job-result.type";
