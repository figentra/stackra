/**
 * Stackra file contract:
 * Purpose: unit tests of `writeLoadReport`: nothing written without `STACKRA_LOAD_REPORT_DIR`, `<dir>/<name>.json`
 *          with the name, the time and the figures when it is set (the folder made when missing), and a name that is
 *          not one file refused.
 * Boundary: test only; writes into the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); STA-317.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { writeLoadReport } from "#node/load-report/write-load-report.function";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "stackra-load-report-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("writeLoadReport", () => {
  it("writes nothing when no report folder is set", () => {
    expect(writeLoadReport("queue.soak", { rate: 1 }, {})).toBeUndefined();
    expect(
      writeLoadReport("queue.soak", { rate: 1 }, { STACKRA_LOAD_REPORT_DIR: "" }),
    ).toBeUndefined();
  });

  it("writes <folder>/<name>.json with the name, the time and the figures", () => {
    const folder = join(dir, "reports");
    const file = writeLoadReport(
      "queue.soak",
      { drained: 6000 },
      { STACKRA_LOAD_REPORT_DIR: folder },
    );
    expect(file).toBe(join(folder, "queue.soak.json"));
    const report = JSON.parse(readFileSync(file ?? "", "utf8")) as Record<string, unknown>;
    expect(report).toMatchObject({ name: "queue.soak", drained: 6000 });
    expect(Number.isNaN(Date.parse(String(report["measuredAt"])))).toBe(false);
  });

  it("refuses a name that is not one file", () => {
    const env = { STACKRA_LOAD_REPORT_DIR: dir };
    for (const name of ["../escape", "a/b", "", ".hidden"])
      expect(() => writeLoadReport(name, {}, env)).toThrow(RangeError);
  });
});
