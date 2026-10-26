/**
 * Stackra file contract:
 * Purpose: unit tests of the `stackra check` phases: their order, and how the tool phases read their tool's output
 *          (oxfmt, cspell, gitleaks, oxlint, turbo typecheck and test, the spec gates) with the tool replaced, plus
 *          "skipped (not installed)" when it cannot start.
 * Boundary: test only; `runCaptured` is replaced, so no tool runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0282 (decision 3); ADR 0022 (test placement).
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHECK_PHASES } from "#node/constants/check-phases.constant";
import { FORMAT_PHASE } from "#node/constants/format-phase.constant";
import { LINT_PHASE } from "#node/constants/lint-phase.constant";
import { SECRETS_PHASE } from "#node/constants/secrets-phase.constant";
import { SPEC_PHASE } from "#node/constants/spec-phase.constant";
import { SPELLING_PHASE } from "#node/constants/spelling-phase.constant";
import { TEST_PHASE } from "#node/constants/test-phase.constant";
import { TYPECHECK_PHASE } from "#node/constants/typecheck-phase.constant";
import { captureIo } from "#node/functions/capture-io.function";
import type { CheckRun } from "#node/types/check-run.type";
import type { ToolOutput } from "#node/types/tool-output.type";

const tool = vi.hoisted(() => ({
  calls: [] as { command: string; args: readonly string[] }[],
  outputs: [] as (ToolOutput | undefined)[],
}));

vi.mock("#node/functions/run-captured.function", () => ({
  runCaptured: async (command: string, args: readonly string[]) => {
    tool.calls.push({ command, args });
    return tool.outputs.shift();
  },
}));

/** A run over a fresh folder. */
function runIn(
  root = mkdtempSync(join(tmpdir(), "phase-")),
  extra: Partial<CheckRun> = {},
): CheckRun {
  return {
    root,
    fix: false,
    files: undefined,
    base: undefined,
    ci: false,
    io: captureIo().io,
    ...extra,
  };
}

beforeEach(() => {
  tool.calls = [];
  tool.outputs = [];
});

describe("check phases", () => {
  it("run in the order of the quality-gate proposal", () => {
    expect(CHECK_PHASES.map((phase) => phase.name)).toEqual([
      "config",
      "format",
      "spelling",
      "secrets",
      "structure",
      "docs",
      "lint",
      "gen",
      "typecheck",
      "catalogues",
      "spec",
      "test",
    ]);
  });

  it("report skipped (not installed) when the tool cannot start", async () => {
    for (const phase of [FORMAT_PHASE, SPELLING_PHASE, LINT_PHASE, TYPECHECK_PHASE, TEST_PHASE]) {
      tool.outputs = [undefined];
      expect(await phase.run(runIn())).toEqual({ findings: [], skipped: "not installed" });
    }
  });

  it("format lists unformatted files as fixable, writes first with --fix, and skips an empty affected set", async () => {
    tool.outputs = [{ code: 1, stdout: "a.ts\nb.md\n", stderr: "" }];
    const { findings } = await FORMAT_PHASE.run(runIn());
    expect(findings.map((f) => [f.path, f.fixable])).toEqual([
      ["a.ts", true],
      ["b.md", true],
    ]);
    tool.outputs = [
      { code: 0, stdout: "", stderr: "" },
      { code: 0, stdout: "", stderr: "" },
    ];
    await FORMAT_PHASE.run(runIn(undefined, { fix: true, files: ["a.ts"] }));
    expect(tool.calls.slice(-2).map((call) => call.args[0])).toEqual([
      "--write",
      "--list-different",
    ]);
    expect(await FORMAT_PHASE.run(runIn(undefined, { files: [] }))).toEqual({ findings: [] });
  });

  it("spelling reads cspell's issue lines", async () => {
    tool.outputs = [{ code: 1, stdout: "./docs/a.md:3:7 - Unknown word (colour)\n", stderr: "" }];
    const { findings } = await SPELLING_PHASE.run(runIn());
    expect(findings).toEqual([
      expect.objectContaining({
        path: "docs/a.md",
        line: 3,
        column: 7,
        rule: "unknown-word",
        adr: "0300",
      }),
    ]);
  });

  it("secrets reports a failed gitleaks run without a report as an exit finding", async () => {
    tool.outputs = [{ code: 126, stdout: "", stderr: "bad flag\n" }];
    const { findings } = await SECRETS_PHASE.run(runIn());
    expect(findings).toEqual([
      expect.objectContaining({ rule: "exit", message: "gitleaks exited 126: bad flag" }),
    ]);
  });

  it("lint reads oxlint's JSON, keeps warnings non-failing, and only lints JS and TS files", async () => {
    const diagnostics = [
      {
        message: "no debugger",
        code: "eslint(no-debugger)",
        severity: "error",
        filename: "a.ts",
        labels: [{ span: { line: 2, column: 13 } }],
      },
      {
        message: "unused",
        code: "eslint(no-unused-vars)",
        severity: "warning",
        filename: "a.ts",
        labels: [],
      },
    ];
    tool.outputs = [{ code: 1, stdout: JSON.stringify({ diagnostics }), stderr: "" }];
    const { findings } = await LINT_PHASE.run(runIn(undefined, { files: ["a.ts", "README.md"] }));
    expect(findings.map((f) => [f.rule, f.line, f.severity])).toEqual([
      ["eslint(no-debugger)", 2, "error"],
      ["eslint(no-unused-vars)", null, "warning"],
    ]);
    expect(tool.calls[0]?.args).toEqual(["-f", "json", "a.ts"]);
  });

  it("typecheck locates compiler errors in their member through the turbo prefix", async () => {
    const root = mkdtempSync(join(tmpdir(), "phase-"));
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*/*\n");
    mkdirSync(join(root, "packages/data/demo"), { recursive: true });
    writeFileSync(join(root, "packages/data/demo/package.json"), '{ "name": "@stackra/demo" }');
    tool.outputs = [
      {
        code: 1,
        stdout:
          "@stackra/demo:typecheck: src/a.ts(4,9): error TS2322: Type 'x' is not assignable.\n",
        stderr: "",
      },
    ];
    const { findings } = await TYPECHECK_PHASE.run(
      runIn(root, { files: ["x"], base: "origin/dev" }),
    );
    expect(findings).toEqual([
      expect.objectContaining({
        path: "packages/data/demo/src/a.ts",
        line: 4,
        column: 9,
        rule: "TS2322",
      }),
    ]);
    expect(tool.calls[0]?.args).toContain("--filter=...[origin/dev]");
  });

  it("test names each failed turbo task", async () => {
    tool.outputs = [
      { code: 1, stdout: " Failed:    @stackra/a#test, @stackra/b#test\n", stderr: "" },
    ];
    const { findings } = await TEST_PHASE.run(runIn());
    expect(findings.map((f) => f.message)).toEqual([
      "@stackra/a#test failed; run `turbo run @stackra/a#test` for the output",
      "@stackra/b#test failed; run `turbo run @stackra/b#test` for the output",
    ]);
  });

  it("spec runs the repository's gates when present and is skipped otherwise", async () => {
    expect(await SPEC_PHASE.run(runIn())).toEqual({ findings: [], skipped: "not installed" });
    const root = mkdtempSync(join(tmpdir(), "phase-"));
    mkdirSync(join(root, "tools/scripts"), { recursive: true });
    writeFileSync(join(root, "tools/scripts/spec-gate.mjs"), "");
    tool.outputs = [{ code: 1, stdout: "", stderr: "spec-gate: tasks.md has no lane\n" }];
    const { findings } = await SPEC_PHASE.run(runIn(root));
    expect(findings).toEqual([
      expect.objectContaining({ rule: "spec-gate", message: "tasks.md has no lane", adr: "0198" }),
    ]);
  });
});
