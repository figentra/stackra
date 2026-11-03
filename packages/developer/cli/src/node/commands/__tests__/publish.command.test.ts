/**
 * Stackra file contract:
 * Purpose: unit tests of `PublishCommand` on the console: a member `checkItemPackage` refuses exits 1 with every
 *          problem as a failed row and never starts `pnpm publish`; a sound member runs `pnpm publish` with the
 *          registry and `--dry-run` through the process port and prints its output.
 * Boundary: test only; writes a throwaway member in the OS temp directory, and pnpm is a memory process runner. The
 *           publish itself runs in the release workflow, not here.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 7 and 11); STA-1966.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MemoryProcessRunnerDriver, runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { PublishCommand } from "#node/commands/publish.command";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "stackra-publish-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("PublishCommand", () => {
  it("refuses a misnamed skill with every problem and never packs", async () => {
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "@acme/archify", stackra: { kind: "skill" } }),
    );
    const process = new MemoryProcessRunnerDriver();
    const result = await runCommandForTest([PublishCommand], ["publish", "--dry-run", "--json"], {
      cwd: dir,
      process,
    });
    expect(result.exitCode).toBe(1);
    const rows = (result.json as { data: { name: string; status: string }[] }).data;
    expect(rows.every((row) => row.status === "fail")).toBe(true);
    const names = rows.map((row) => row.name).join("\n");
    expect(names).toContain("@acme/archify is not in @stackra or @stackra-pro");
    expect(names).toContain("a skill item must be named @<scope>/skill-<name>");
    expect(names).toContain("a skill item needs SKILL.md at its root");
    expect(process.calls).toEqual([]);
  });

  it("publishes a sound member to the registry and prints pnpm's output", async () => {
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "@stackra/skill-archify", stackra: { kind: "skill" } }),
    );
    writeFileSync(join(dir, "SKILL.md"), "# Archify");
    const line = "pnpm publish --registry https://npm.stackra.example/ --no-git-checks --dry-run";
    const process = new MemoryProcessRunnerDriver().on(line, { output: "npm notice SKILL.md\n" });
    const result = await runCommandForTest(
      [PublishCommand],
      ["publish", "--dry-run", "--registry", "https://npm.stackra.example/"],
      { cwd: dir, process },
    );
    expect(result.exitCode).toBe(0);
    expect(process.calls.map((call) => [call.line, call.cwd])).toEqual([[line, dir]]);
    expect(result.stdout).toContain("npm notice SKILL.md");
  });
});
