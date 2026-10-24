/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/errors (`refusal` and the `toRefuseWith` matcher) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Importing it registers `toRefuseWith` with `expect`, which is
 *           why package.json lists this entry under `sideEffects`. Imports `.` and `@stackra/testing` only; no other
 *           package's `./testing` (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { refusal } from "#testing/functions/refusal.function";
export { toRefuseWith } from "#testing/to-refuse-with.matcher";
