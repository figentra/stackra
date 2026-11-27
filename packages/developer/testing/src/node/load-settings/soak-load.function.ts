/**
 * Stackra file contract:
 * Purpose: `soakLoad(defaults, env)`, the arrival-rate load of a soak: the test's own rate and duration, each
 *          overridden by `STACKRA_LOAD_RATE` (iterations a second) and `STACKRA_LOAD_DURATION` (a k6 duration such as
 *          `30m`), so the same file runs a short check on a workstation and an hour's soak in the weekly run. The
 *          virtual users are sized for a subject that answers within a quarter of a second, and may grow fourfold.
 * Boundary: pure apart from reading `env`; a malformed override is refused, never ignored.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */
import type { K6Load } from "#node/k6/k6-load.type";

/** A k6 duration: a whole number of milliseconds, seconds, minutes or hours. */
const DURATION = /^[1-9]\d*(ms|s|m|h)$/;

/** A rate: a whole number of iterations a second. */
const RATE = /^[1-9]\d*$/;

/**
 * The soak load of a test whose own figures are `defaults`.
 *
 * @param defaults - the test's rate (iterations a second) and duration.
 * @param env - the environment to read; the process's by default.
 * @throws RangeError when `STACKRA_LOAD_RATE` or `STACKRA_LOAD_DURATION` is set and malformed.
 * @example
 * soakLoad({ rate: 200, duration: "30s" }); // { executor: "constant-arrival-rate", rate: 200, ... }
 */
export function soakLoad(
  defaults: { readonly rate: number; readonly duration: string },
  env: NodeJS.ProcessEnv = process.env,
): Extract<K6Load, { readonly executor: "constant-arrival-rate" }> {
  const rateText = env["STACKRA_LOAD_RATE"];
  const duration = env["STACKRA_LOAD_DURATION"] ?? defaults.duration;
  if (rateText !== undefined && !RATE.test(rateText))
    throw new RangeError(
      `STACKRA_LOAD_RATE is not a whole number of iterations a second: ${rateText}`,
    );
  if (!DURATION.test(duration))
    throw new RangeError(`not a k6 duration (such as 30s, 10m or 1h): ${duration}`);
  const rate = rateText === undefined ? defaults.rate : Number(rateText);
  const preAllocatedVUs = Math.max(10, Math.ceil(rate / 4));
  return {
    executor: "constant-arrival-rate",
    rate,
    duration,
    preAllocatedVUs,
    maxVUs: preAllocatedVUs * 4,
  };
}
