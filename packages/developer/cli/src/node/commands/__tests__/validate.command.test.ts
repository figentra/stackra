/**
 * Stackra file contract:
 * Purpose: unit tests of `ValidateCommand`: without `--repository` it runs its check phases (config, structure,
 *          docs, catalogues, spec); with it, the repository gate prints each finding as `<dir>: <finding>` and the count
 *          on standard error and exits 1, writes the findings as the `--json` data, and is silent with 0 when clean.
 * Boundary: test only; `runCheck` and every finding source are replaced by fakes, so no checkout is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 3 and 5); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ValidateCommand } from "#node/commands/validate.command";
import { packageCycleFindings } from "#node/cycles/functions/package-cycle-findings.function";
import { runCheck } from "#node/functions/run-check.function";

vi.mock("#node/functions/run-check.function", () => ({
  runCheck: vi.fn(async () => ({ code: 0, findings: [], phases: [] })),
}));
vi.mock("#node/functions/workspace-root.function", () => ({ workspaceRoot: () => "/repo" }));
vi.mock("@stackra/repo-checks/node", () => ({
  readRepoContext: () => ({}),
  configFindings: () => [],
  catalogueFindings: () => [],
  structureFindings: async () => [],
}));
vi.mock("#node/any-ratchet/functions/any-ratchet-findings.function", () => ({
  anyRatchetFindings: () => [],
}));
vi.mock("#node/app-native-deps/functions/app-native-dependency-findings.function", () => ({
  appNativeDependencyFindings: () => [],
}));
vi.mock("#node/architecture-map/functions/architecture-map-findings.function", () => ({
  architectureMapFindings: () => [],
}));
vi.mock("#node/cycles/functions/package-cycle-findings.function", () => ({
  packageCycleFindings: vi.fn(() => []),
}));
vi.mock("#node/duplicate-exports/functions/duplicate-export-findings.function", () => ({
  duplicateExportFindings: () => [],
}));
vi.mock("#node/launch-config/functions/launch-config-findings.function", () => ({
  launchConfigFindings: () => [],
}));
vi.mock("#node/lang-assets/functions/lang-assets-findings.function", () => ({
  langAssetsFindings: () => [],
}));
vi.mock("#node/package-entities/functions/package-entities-findings.function", () => ({
  packageEntitiesFindings: () => [],
}));
vi.mock("#node/python-placement/functions/python-placement-findings.function", () => ({
  pythonPlacementFindings: () => [],
}));
vi.mock("#node/session-settings/functions/session-setting-findings.function", () => ({
  sessionSettingFindings: () => [],
}));

beforeEach(() => {
  vi.mocked(runCheck).mockClear();
  vi.mocked(packageCycleFindings).mockReset().mockReturnValue([]);
});

describe("ValidateCommand", () => {
  it("runs its check phases without --repository", async () => {
    expect((await runCommandForTest([ValidateCommand], ["validate"])).exitCode).toBe(0);
    expect(vi.mocked(runCheck).mock.calls[0]?.[1]).toEqual({
      only: ["config", "structure", "docs", "catalogues", "spec"],
    });
  });

  it("prints the repository gate's findings and their count on standard error and exits 1", async () => {
    vi.mocked(packageCycleFindings).mockReturnValue([
      { dir: "packages/a", text: "cycle a -> b -> a" },
      { dir: "", text: "root finding" },
    ]);
    const result = await runCommandForTest([ValidateCommand], ["validate", "--repository"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("packages/a: cycle a -> b -> a\n.: root finding\n\n2 finding(s).\n");
    expect(runCheck).not.toHaveBeenCalled();
    const json = await runCommandForTest([ValidateCommand], ["validate", "--repository", "--json"]);
    expect(json.json).toEqual({
      ok: false,
      data: {
        findings: [
          { dir: "packages/a", text: "cycle a -> b -> a" },
          { dir: "", text: "root finding" },
        ],
      },
    });
  });

  it("is silent and exits 0 when the repository is clean", async () => {
    const result = await runCommandForTest([ValidateCommand], ["validate", "--repository"]);
    expect([result.exitCode, result.stdout, result.stderr]).toEqual([0, "", ""]);
  });
});
