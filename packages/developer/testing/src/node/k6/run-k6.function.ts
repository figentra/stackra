/**
 * Stackra file contract:
 * Purpose: `runK6(options)`, one k6 run of `K6_SCENARIO_SCRIPT` against a load target: it writes the script to a
 *          temporary folder, runs `k6 run` with `k6Args`, waits for it and reads the summary it exported. A run whose
 *          thresholds held answers `passed: true`; one that crossed a threshold (k6 exits 99) answers `passed: false`
 *          with the crossed ones named, so the test asserts on it and prints the numbers.
 * Boundary: spawns k6 without a shell, inheriting the environment; keeps the last 4 KiB of its error output for the
 *           message of a run that could not finish; removes the temporary folder whatever happens.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { k6Args } from "#node/k6/k6-args.function";
import { k6Binary } from "#node/k6/k6-binary.function";
import type { K6Result } from "#node/k6/k6-result.type";
import { K6_SCENARIO_SCRIPT } from "#node/k6/k6-scenario-script.constant";
import { readK6Summary } from "#node/k6/read-k6-summary.function";
import type { RunK6Options } from "#node/k6/run-k6-options.type";

/** The exit code of a k6 run that finished with a crossed threshold. */
const THRESHOLDS_CROSSED = 99;

/** How much of k6's error output a failure message keeps. */
const TAIL_BYTES = 4096;

/**
 * Runs k6 against `options.target`.
 *
 * @returns what the run measured; `passed` is false when a threshold was crossed.
 * @throws Error when no k6 is installed, or k6 could not finish the run (a script or option error, a signal).
 * @example
 * const result = await runK6({
 *   target: target.url,
 *   scenario: "push",
 *   load: { executor: "constant-arrival-rate", rate: 200, duration: "1m", preAllocatedVUs: 50 },
 *   thresholds: { http_req_failed: ["rate<0.001"] },
 * });
 * expect(result.crossed).toEqual([]);
 */
export async function runK6(options: RunK6Options): Promise<K6Result> {
  const k6 = options.k6 ?? k6Binary();
  if (k6 === undefined)
    throw new Error("k6 is not installed: put it on PATH or name it in STACKRA_K6");
  const dir = mkdtempSync(join(tmpdir(), "stackra-k6-"));
  try {
    const files = { script: join(dir, "run.js"), summary: join(dir, "summary.json") };
    writeFileSync(files.script, K6_SCENARIO_SCRIPT);
    const { code, signal, stderr } = await new Promise<{
      code: number | null;
      signal: NodeJS.Signals | null;
      stderr: string;
    }>((resolve, reject) => {
      const child = spawn(k6, [...k6Args(options, files)], {
        stdio: ["ignore", "ignore", "pipe"],
      });
      let tail = "";
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (chunk: string) => {
        tail = (tail + chunk).slice(-TAIL_BYTES);
      });
      child.once("error", reject);
      child.once("close", (exit, killedBy) =>
        resolve({ code: exit, signal: killedBy, stderr: tail }),
      );
    });
    if ((code !== 0 && code !== THRESHOLDS_CROSSED) || !existsSync(files.summary)) {
      const how = signal === null ? `exited ${String(code)}` : `was stopped by ${signal}`;
      throw new Error(`k6 ${how} before it finished the run:\n${stderr.trim()}`);
    }
    const result = readK6Summary(JSON.parse(readFileSync(files.summary, "utf8")));
    // k6 decides; the summary names the crossed thresholds.
    return code === 0 ? result : { ...result, passed: false };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
