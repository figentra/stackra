/**
 * Stackra file contract:
 * Purpose: unit tests of the check-family command classes (`check`, `verify`, `validate`, `code:check`, `code:fix`):
 *          under `--json` the document's data is `{ phases, findings }`, each phase's status, counts and `durationMs`
 *          and every finding, with or without `--format json`; `validate --repository --json` reports its findings as
 *          `{ dir, text }`; and standard output then holds the document alone.
 * Boundary: test only; `CHECK_PHASES` and the repository finding functions are replaced, so no tool runs. Runs in a
 *           throwaway folder in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-2883 spec FR-005.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CheckCommand } from "#node/commands/check.command";
import { CodeCheckCommand } from "#node/commands/code-check.command";
import { CodeFixCommand } from "#node/commands/code-fix.command";
import { ValidateCommand } from "#node/commands/validate.command";
import { VerifyCommand } from "#node/commands/verify.command";
import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";

const state = vi.hoisted(() => ({ phases: [] as CheckPhase[] }));

vi.mock("#node/constants/check-phases.constant", () => ({
  get CHECK_PHASES() {
    return state.phases;
  },
}));

vi.mock("@stackra/repo-checks/node", async (original) => ({
  ...(await original<object>()),
  readRepoContext: () => ({}),
  configFindings: () => [{ dir: "packages/a", text: "convert a.json (ADR 0007)" }],
  layoutFindings: () => [{ dir: "", text: "a stray folder" }],
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
  packageCycleFindings: () => [],
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
vi.mock(
  "#node/row-security-declarations/functions/row-security-declaration-findings.function",
  () => ({ rowSecurityDeclarationFindings: () => [] }),
);
vi.mock("#node/session-settings/functions/session-setting-findings.function", () => ({
  sessionSettingFindings: () => [],
}));

/** The finding the `config` stand-in phase returns. */
const FINDING = toolFinding(
  { name: "config", tool: "repo-checks", adr: null },
  { rule: "json-configs", path: "x.json", message: "convert (ADR 0007)", fixable: true },
);

/** Every check-family class with its command name. */
const CLASSES = [
  ["check", CheckCommand],
  ["verify", VerifyCommand],
  ["validate", ValidateCommand],
  ["code:check", CodeCheckCommand],
  ["code:fix", CodeFixCommand],
] as const;

let cwd: string;

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "stackra-check-"));
  state.phases = [
    { name: "config", tool: "repo-checks", adr: null, run: async () => ({ findings: [FINDING] }) },
    { name: "spelling", tool: "cspell", adr: null, run: async () => ({ findings: [] }) },
  ];
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

describe("the check commands under --json", () => {
  // @covers sta-2883:FR-005
  it.each(CLASSES)("%s --json reports the phases and every finding", async (name, command) => {
    const result = await runCommandForTest(
      [command],
      [name, "--only", "config,spelling", "--keep-going", "--json"],
      { cwd },
    );
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout)).toEqual(result.json);
    const { data } = result.json as { data: unknown };
    expect(data).toEqual({
      phases: [
        {
          phase: "config",
          status: "failed",
          findings: 1,
          fixable: 1,
          durationMs: expect.any(Number),
        },
        {
          phase: "spelling",
          status: "passed",
          findings: 0,
          fixable: 0,
          durationMs: expect.any(Number),
        },
      ],
      findings: [
        expect.objectContaining({ phase: "config", rule: "json-configs", path: "x.json" }),
      ],
    });
  });

  // @covers sta-2883:FR-005
  it("reports the same structured data when --format json is given too", async () => {
    const result = await runCommandForTest(
      [CheckCommand],
      ["check", "--only", "config", "--format", "json", "--json"],
      { cwd },
    );
    expect(result.exitCode).toBe(1);
    const { data } = result.json as { data: { phases: unknown[]; findings: unknown[] } };
    expect(data.phases).toEqual([expect.objectContaining({ phase: "config", status: "failed" })]);
    expect(data.findings).toEqual([expect.objectContaining({ rule: "json-configs" })]);
  });

  // @covers sta-2883:FR-005
  it("validate --repository --json reports each finding by folder", async () => {
    const result = await runCommandForTest(
      [ValidateCommand],
      ["validate", "--repository", "--json"],
      {
        cwd,
      },
    );
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout)).toEqual(result.json);
    expect((result.json as { data: unknown }).data).toEqual({
      findings: [
        { dir: "packages/a", text: "convert a.json (ADR 0007)" },
        { dir: ".", text: "a stray folder" },
      ],
    });
  });
});
