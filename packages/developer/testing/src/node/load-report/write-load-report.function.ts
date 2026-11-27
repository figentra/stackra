/**
 * Stackra file contract:
 * Purpose: `writeLoadReport(name, report, env)`, keeps one load test's numbers: when `STACKRA_LOAD_REPORT_DIR` names a
 *          folder it writes `<folder>/<name>.json` (the weekly run uploads that folder, and the capacity page is read
 *          from it); otherwise it writes nothing.
 * Boundary: creates the folder when missing; overwrites a report of the same name. A report holds figures only.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** A report name: letters, digits, `.`, `_` or `-`, so it stays one file in the folder. */
const NAME = /^[\w.-]+$/;

/**
 * Writes `report` as `<STACKRA_LOAD_REPORT_DIR>/<name>.json`.
 *
 * @returns the file written, or `undefined` when no report folder is set.
 * @throws RangeError when `name` is not one file name.
 * @example
 * writeLoadReport("queue.soak", { k6: result, server: target.latency("push") });
 */
export function writeLoadReport(
  name: string,
  report: Readonly<Record<string, unknown>>,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  if (!NAME.test(name) || name.startsWith(".")) throw new RangeError(`not a report name: ${name}`);
  const dir = env["STACKRA_LOAD_REPORT_DIR"];
  if (dir === undefined || dir === "") return undefined;
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.json`);
  writeFileSync(
    file,
    `${JSON.stringify({ name, measuredAt: new Date().toISOString(), ...report }, null, 2)}\n`,
  );
  return file;
}
