/**
 * Stackra file contract:
 * Purpose: unit tests of `DuplicationCommand` on the console: a member above its baseline exits 1 with the findings as
 *          `--json` data, and `--update` rewrites the baseline under its kept comment header and exits 0.
 * Boundary: test only; jscpd is never run (the measurement is replaced) and the baseline lives in a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DuplicationCommand } from "#node/commands/duplication.command";
import { BASELINE_PATH } from "#node/duplication/constants/baseline-path.constant";
import { measureMembers } from "#node/duplication/functions/measure-members.function";

vi.mock("#node/duplication/functions/measure-members.function", () => ({
  measureMembers: vi.fn(),
}));

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-duplication-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  mkdirSync(dirname(join(root, BASELINE_PATH)), { recursive: true });
  writeFileSync(
    join(root, BASELINE_PATH),
    "# header kept\nnewMemberCap: 5\nmembers:\n  packages/data/model:\n    src: 1\n    tests: 0\n",
  );
  vi.mocked(measureMembers).mockReset();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("DuplicationCommand", () => {
  it("exits 1 when a member rises above its baseline, the findings as --json data", async () => {
    vi.mocked(measureMembers).mockReturnValue({ "packages/data/model": { src: 9, tests: 0 } });
    const result = await runCommandForTest([DuplicationCommand], ["duplication", "--json"], {
      cwd: root,
    });
    expect(result.exitCode).toBe(1);
    const data = (result.json as { data: { dir: string }[] }).data;
    expect(data.map((finding) => finding.dir)).toEqual(["packages/data/model"]);
  });

  it("rewrites the baseline under its header with --update and exits 0", async () => {
    vi.mocked(measureMembers).mockReturnValue({ "packages/data/model": { src: 9, tests: 0 } });
    const result = await runCommandForTest([DuplicationCommand], ["duplication", "--update"], {
      cwd: root,
    });
    expect(result.exitCode).toBe(0);
    const written = readFileSync(join(root, BASELINE_PATH), "utf8");
    expect(written.startsWith("# header kept\n")).toBe(true);
    expect(written).toContain("packages/data/model");
  });
});
