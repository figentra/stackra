/**
 * Stackra file contract:
 * Purpose: a fake `gh` for the STA-302 retry tests. Run n plays `steps[n]` (the last step repeats): `out` to stdout,
 *   `err` to stderr, exit `code` (default 0). It counts its runs in a file.
 * Boundary: writes only to a fresh temp directory; no network.
 */
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Installs the fake in a temp dir; returns a PATH that finds it first and a reader of its run count. */
export function fakeGh(steps) {
  const dir = mkdtempSync(join(tmpdir(), "fake-gh-"));
  const runs = join(dir, "runs");
  writeFileSync(runs, "0");
  writeFileSync(
    join(dir, "gh"),
    `#!${process.execPath}
const fs = require("fs");
const n = Number(fs.readFileSync(${JSON.stringify(runs)}, "utf8"));
fs.writeFileSync(${JSON.stringify(runs)}, String(n + 1));
const step = ${JSON.stringify(steps)}[Math.min(n, ${steps.length - 1})];
process.stdout.write(step.out ?? "");
process.stderr.write(step.err ?? "");
process.exitCode = step.code ?? 0;
`,
  );
  chmodSync(join(dir, "gh"), 0o755);
  return { path: `${dir}:${process.env.PATH}`, runs: () => Number(readFileSync(runs, "utf8")) };
}
