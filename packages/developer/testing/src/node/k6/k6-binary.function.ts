/**
 * Stackra file contract:
 * Purpose: `k6Binary(env)`, the k6 a load test runs: `STACKRA_K6` when it names a file, else the first `k6` on `PATH`,
 *          else none, in which case a load test skips itself (as an int test skips without `TESTBED_POSTGRES_HOST`).
 * Boundary: reads the environment it is given and checks files exist; runs nothing.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */
import { existsSync, statSync } from "node:fs";
import { delimiter, join } from "node:path";

/** Whether `path` is a file. */
const isFile = (path: string): boolean => existsSync(path) && statSync(path).isFile();

/**
 * The k6 binary, or `undefined` when none is installed.
 *
 * @param env - the environment to read; the process's by default.
 * @example
 * describe.skipIf(k6Binary() === undefined)("the queue under load", () => { ... });
 */
export function k6Binary(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const named = env["STACKRA_K6"];
  if (named !== undefined && named !== "") return isFile(named) ? named : undefined;
  for (const dir of (env["PATH"] ?? "").split(delimiter).filter((entry) => entry !== "")) {
    const candidate = join(dir, process.platform === "win32" ? "k6.exe" : "k6");
    if (isFile(candidate)) return candidate;
  }
  return undefined;
}
