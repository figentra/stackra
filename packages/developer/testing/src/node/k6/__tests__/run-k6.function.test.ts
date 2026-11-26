/**
 * Stackra file contract:
 * Purpose: unit tests of `k6Binary` and `runK6` with a stand-in k6 (a shell script that records its arguments and writes
 *          a summary export): `STACKRA_K6` wins over `PATH` and a missing file answers none; a run that exits 0 passes
 *          with the summary read; one that exits 99 fails with the crossed threshold named; one that dies without a
 *          summary throws with k6's error output; no k6 at all throws; the temporary folder is removed.
 * Boundary: test only; writes the stand-in into the OS temp directory and runs it (POSIX shell). Never runs real k6.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); STA-317.
 */
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { k6Binary } from "#node/k6/k6-binary.function";
import { runK6 } from "#node/k6/run-k6.function";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "stackra-k6-test-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** A summary export with `failed` as the failed share and a crossed rate threshold when `crossed`. */
const summary = (crossed: boolean) =>
  JSON.stringify({
    metrics: {
      http_reqs: { count: 100, rate: 50 },
      http_req_failed: { value: crossed ? 0.2 : 0, thresholds: { "rate<0.01": crossed } },
      http_req_duration: { avg: 2, med: 1.5, max: 9, "p(90)": 3, "p(95)": 4, "p(99)": 8 },
    },
  });

/**
 * A stand-in k6 that writes its arguments to `args.txt`, the summary to the path after `--summary-export` (unless
 * `writes` is false) and exits `code`.
 */
const standIn = (code: number, options: { summary?: string; writes?: boolean } = {}): string => {
  const path = join(dir, "k6");
  writeFileSync(join(dir, "summary.src.json"), options.summary ?? summary(code === 99));
  writeFileSync(
    path,
    [
      "#!/bin/sh",
      `printf '%s\\n' "$@" > "${join(dir, "args.txt")}"`,
      'out=""; prev=""',
      'for arg in "$@"; do [ "$prev" = "--summary-export" ] && out="$arg"; prev="$arg"; done',
      options.writes === false ? "" : `cp "${join(dir, "summary.src.json")}" "$out"`,
      'echo "level=error msg=\\"stand-in k6 stderr\\"" >&2',
      `exit ${code}`,
      "",
    ].join("\n"),
  );
  chmodSync(path, 0o755);
  return path;
};

const OPTIONS = {
  target: "http://127.0.0.1:4100",
  scenario: "push",
  load: { executor: "constant-vus", vus: 2, duration: "1s" },
} as const;

describe("k6Binary", () => {
  it("takes STACKRA_K6 when it names a file, else the first k6 on PATH, else none", () => {
    const k6 = standIn(0);
    expect(k6Binary({ STACKRA_K6: k6, PATH: "" })).toBe(k6);
    expect(k6Binary({ STACKRA_K6: join(dir, "missing"), PATH: dir })).toBeUndefined();
    expect(k6Binary({ PATH: `${join(dir, "nowhere")}:${dir}` })).toBe(k6);
    expect(k6Binary({ PATH: join(dir, "nowhere") })).toBeUndefined();
    expect(k6Binary({})).toBeUndefined();
  });
});

describe("runK6", () => {
  it("passes a run whose thresholds held and reads its summary", async () => {
    const result = await runK6({ ...OPTIONS, k6: standIn(0) });
    expect(result).toMatchObject({ passed: true, crossed: [], requests: 100, rate: 50 });
    expect(result.duration.p95).toBe(4);
    const args = readFileSync(join(dir, "args.txt"), "utf8").trim().split("\n");
    expect(args[0]).toBe("run");
    expect(args).toContain("STACKRA_LOAD_NAME=push");
    // the script and the summary lived in a temporary folder that is gone
    const script = args.at(-1) ?? "";
    expect(script.endsWith("run.js")).toBe(true);
    expect(existsSync(script)).toBe(false);
  });

  it("fails a run that crossed a threshold (exit 99) and names it", async () => {
    const result = await runK6({ ...OPTIONS, k6: standIn(99) });
    expect(result.passed).toBe(false);
    expect(result.crossed).toEqual(["http_req_failed: rate<0.01"]);
    expect(result.failedRate).toBe(0.2);
  });

  it("fails an exit 99 even when the summary names no crossed threshold", async () => {
    const result = await runK6({ ...OPTIONS, k6: standIn(99, { summary: summary(false) }) });
    expect(result.passed).toBe(false);
  });

  it("throws with k6's error output when the run did not finish", async () => {
    await expect(runK6({ ...OPTIONS, k6: standIn(107) })).rejects.toThrow(
      /k6 exited 107 before it finished the run:\n.*stand-in k6 stderr/,
    );
    await expect(runK6({ ...OPTIONS, k6: standIn(0, { writes: false }) })).rejects.toThrow(
      "k6 exited 0 before it finished the run",
    );
  });

  it("throws when no k6 is installed", async () => {
    const saved = process.env["STACKRA_K6"];
    process.env["STACKRA_K6"] = join(dir, "missing");
    try {
      await expect(runK6(OPTIONS)).rejects.toThrow("k6 is not installed");
    } finally {
      if (saved === undefined) delete process.env["STACKRA_K6"];
      else process.env["STACKRA_K6"] = saved;
    }
  });
});
