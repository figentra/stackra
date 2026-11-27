/**
 * Stackra file contract:
 * Purpose: `k6Args(options, files)`, the arguments of one `k6 run`: quiet, no usage report, no colour, the summary
 *          exported to `files.summary`, and the target, scenario, executor and thresholds passed as `-e` variables to
 *          `K6_SCENARIO_SCRIPT` at `files.script`.
 * Boundary: pure; never parsed by a shell (`runK6` spawns without one). An arrival-rate load gets k6's per-second time
 *           unit and `maxVUs` defaulted to `preAllocatedVUs`.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */
import type { RunK6Options } from "#node/k6/run-k6-options.type";

/** The executor object k6 reads from `STACKRA_LOAD_EXECUTOR`. */
function executorOf(load: RunK6Options["load"]): Record<string, unknown> {
  if (load.executor === "constant-vus")
    return { executor: load.executor, vus: load.vus, duration: load.duration };
  return {
    executor: load.executor,
    rate: load.rate,
    timeUnit: "1s",
    duration: load.duration,
    preAllocatedVUs: load.preAllocatedVUs,
    maxVUs: load.maxVUs ?? load.preAllocatedVUs,
  };
}

/**
 * The `k6 run` arguments of `options`.
 *
 * @param options - the run.
 * @param files - where the script is and where the summary goes.
 * @example
 * k6Args({ target, scenario: "push", load }, { script: "/tmp/x/run.js", summary: "/tmp/x/summary.json" });
 * // ["run", "--quiet", ..., "/tmp/x/run.js"]
 */
export function k6Args(
  options: RunK6Options,
  files: { readonly script: string; readonly summary: string },
): readonly string[] {
  const env = {
    STACKRA_LOAD_TARGET: options.target.replace(/\/+$/, ""),
    STACKRA_LOAD_NAME: options.scenario,
    STACKRA_LOAD_EXECUTOR: JSON.stringify(executorOf(options.load)),
    STACKRA_LOAD_THRESHOLDS: JSON.stringify(options.thresholds ?? {}),
  };
  return [
    "run",
    "--quiet",
    "--no-usage-report",
    "--no-color",
    "--summary-export",
    files.summary,
    ...Object.entries(env).flatMap(([name, value]) => ["-e", `${name}=${value}`]),
    files.script,
  ];
}
