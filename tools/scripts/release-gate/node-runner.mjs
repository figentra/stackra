/**
 * Stackra file contract:
 * Purpose: the Node leg of the release gate's packed-tarball smoke (ADR 0177 PK4). Copied into the throwaway
 *   consumer by `release-gate.mjs smoke`; imports each entry named in the specs file in a fresh Node process (so one
 *   entry's side effects or a hung handle never touch another) and prints one JSON line per entry:
 *   `{ "spec": "...", "ok": true }` or `{ "spec": "...", "ok": false, "error": "..." }`.
 * Boundary: loads the consumer's installed packages only; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0177 (decision 4); STA-2705.
 */
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { availableParallelism } from "node:os";

const specs = JSON.parse(readFileSync(process.argv[2], "utf8"));
/** An import that has not settled in this long is reported, not waited on. */
const TIMEOUT_MS = 60_000;

/** The first error line of a failed import, without the consumer's long store paths. */
function firstError(text) {
  const line =
    text
      .split("\n")
      .map((row) => row.trim())
      .find((row) => /(?:Error|error)\b/.test(row)) ??
    text.trim().split("\n")[0] ??
    "failed";
  return line
    .replaceAll(/\/[^\s'"]*\/node_modules\/\.pnpm\/[^/]+\/node_modules\//g, "")
    .slice(0, 600);
}

/** Imports one entry in its own process; exits as soon as the module graph is evaluated. */
function importOne(spec) {
  return new Promise((done) => {
    execFile(
      process.execPath,
      ["--input-type=module", "-e", `await import(${JSON.stringify(spec)}); process.exit(0);`],
      { timeout: TIMEOUT_MS, maxBuffer: 1 << 24 },
      (error, _stdout, stderr) =>
        done(
          error
            ? {
                spec,
                ok: false,
                error: error.killed
                  ? `no answer in ${TIMEOUT_MS / 1000} s`
                  : firstError(stderr || error.message),
              }
            : { spec, ok: true },
        ),
    );
  });
}

let next = 0;
const workers = Array.from({ length: Math.min(8, availableParallelism()) }, async () => {
  while (next < specs.length) {
    const spec = specs[next];
    next += 1;
    console.log(JSON.stringify(await importOne(spec)));
  }
});
await Promise.all(workers);
