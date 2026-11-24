/**
 * Stackra file contract:
 * Purpose: unit tests of `ConstitutionCommand` on the console: it writes the rendered constitution to its output path (creating the folder) and
 *          says so; with no docs laws it writes nothing and says that; `--check` exits 0 with its message when the file is current
 *          and exits 1 with one failed row per drift (the findings as `--json` data), and writes nothing.
 * Boundary: test only; `@stackra/repo-checks/node` is a fake and the workspace is a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0510; STA-2098 (H6).
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { constitutionFindings, expectedConstitution } from "@stackra/repo-checks/node";

import { ConstitutionCommand } from "#node/commands/constitution.command";

vi.mock("@stackra/repo-checks/node", () => ({
  CONSTITUTION_PATHS: { source: "docs/laws.mdx", output: ".flow/constitution.md" },
  constitutionFindings: vi.fn(),
  expectedConstitution: vi.fn(),
  readRepoContext: vi.fn((root: string) => ({ root })),
}));

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-constitution-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  vi.mocked(constitutionFindings).mockReset().mockReturnValue([]);
  vi.mocked(expectedConstitution).mockReset().mockReturnValue("# Constitution\n");
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

const run = (...argv: string[]) =>
  runCommandForTest([ConstitutionCommand], ["constitution", ...argv], { cwd: root });

describe("ConstitutionCommand", () => {
  it("writes the rendered constitution to .flow/constitution.md, creating the folder, and says so", async () => {
    const result = await run();

    expect(result.exitCode).toBe(0);
    expect(expectedConstitution).toHaveBeenCalledWith(root);
    expect(readFileSync(join(root, ".flow", "constitution.md"), "utf8")).toBe("# Constitution\n");
    expect(result.stdout).toContain("wrote .flow/constitution.md");
  });

  it("overwrites a constitution that is already there", async () => {
    await run();
    vi.mocked(expectedConstitution).mockReturnValue("# Changed\n");
    await run();
    expect(readFileSync(join(root, ".flow", "constitution.md"), "utf8")).toBe("# Changed\n");
  });

  it("writes nothing and says why when there are no docs laws", async () => {
    vi.mocked(expectedConstitution).mockReturnValue(undefined);
    const result = await run();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("no docs/laws.mdx: nothing to write");
    expect(existsSync(join(root, ".flow"))).toBe(false);
  });

  it("--check exits 0 with its message when the file is current, and writes nothing", async () => {
    const result = await run("--check");

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("the constitution is current");
    expect(constitutionFindings).toHaveBeenCalledWith({ root });
    expect(expectedConstitution).not.toHaveBeenCalled();
    expect(existsSync(join(root, ".flow"))).toBe(false);
  });

  it("--check exits 1 on drift, one failed row per finding, the findings as --json data", async () => {
    const drift = {
      rule: "constitution",
      dir: ".flow",
      text: "constitution.md is out of date: run `stackra constitution`",
    };
    vi.mocked(constitutionFindings).mockReturnValue([drift]);

    const text = await run("--check");
    expect(text.exitCode).toBe(1);
    expect(text.stdout + text.stderr).toContain("out of date");

    const json = await run("--check", "--json");
    expect(json.exitCode).toBe(1);
    expect(json.json).toEqual({ ok: false, data: [drift] });
    expect(existsSync(join(root, ".flow", "constitution.md"))).toBe(false);
  });
});
