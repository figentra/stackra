/**
 * Stackra file contract:
 * Purpose: unit tests of `ArchitectureMapCommand` on the console: `--check` exits 1 on drift with the findings as
 *          `--json` data, and the default run writes the candidate, runs archify once through `io.process` in the
 *          workspace root and exits with archify's own code.
 * Boundary: test only; the map inputs and drift check are replaced, archify is a scripted process, and the workspace
 *           is a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { MemoryProcessRunnerDriver, runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MAP_OUTPUT } from "#node/architecture-map/constants/map-output.constant";
import { MAP_SOURCE } from "#node/architecture-map/constants/map-source.constant";
import { architectureMapFindings } from "#node/architecture-map/functions/architecture-map-findings.function";
import { ArchitectureMapCommand } from "#node/commands/architecture-map.command";

vi.mock("#node/architecture-map/functions/architecture-map-findings.function", () => ({
  architectureMapFindings: vi.fn(),
}));
vi.mock("#node/architecture-map/functions/read-architecture-inputs.function", () => ({
  readArchitectureInputs: () => ({}),
}));
vi.mock("#node/architecture-map/functions/render-architecture-map.function", () => ({
  renderArchitectureMap: () => ({ nodes: [] }),
}));

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-architecture-map-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  mkdirSync(dirname(join(root, MAP_SOURCE)), { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** The archify line the command runs in `root`. */
const archifyLine = (): string => {
  const outDir = join(root, "node_modules", ".cache", "archify-architecture-map");
  return [
    process.execPath,
    ".agents/skills/archify/bin/archify.mjs",
    "finalize",
    "architecture",
    join(outDir, "architecture-map.json"),
    MAP_OUTPUT,
    "--quality",
    "standard",
    "--out-dir",
    outDir,
    "--json",
  ].join(" ");
};

describe("ArchitectureMapCommand", () => {
  it("--check exits 1 on drift, the findings as --json data", async () => {
    const drift = { dir: MAP_SOURCE, text: "drifted; run stackra architecture-map" };
    vi.mocked(architectureMapFindings).mockReturnValue([drift]);
    const result = await runCommandForTest(
      [ArchitectureMapCommand],
      ["architecture-map", "--check", "--json"],
      { cwd: root },
    );
    expect(result.exitCode).toBe(1);
    expect(result.json).toEqual({ ok: false, data: [drift] });
  });

  it("writes the candidate and runs archify once in the root", async () => {
    const runner = new MemoryProcessRunnerDriver().on(archifyLine(), { code: 0 });
    const result = await runCommandForTest([ArchitectureMapCommand], ["architecture-map"], {
      cwd: root,
      process: runner,
    });
    expect(result.exitCode).toBe(0);
    expect(existsSync(join(root, MAP_SOURCE))).toBe(true);
    expect(runner.calls.map((call) => call.cwd)).toEqual([root]);
  });

  it("exits with archify's own code when it fails", async () => {
    const runner = new MemoryProcessRunnerDriver().on(archifyLine(), {
      code: 3,
      output: "bad candidate\n",
    });
    const result = await runCommandForTest([ArchitectureMapCommand], ["architecture-map"], {
      cwd: root,
      process: runner,
    });
    expect(result.exitCode).toBe(3);
    expect(result.stderr).toContain("bad candidate");
  });
});
