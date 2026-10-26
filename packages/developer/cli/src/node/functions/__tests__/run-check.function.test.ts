/**
 * Stackra file contract:
 * Purpose: unit tests of `runCheck` over stand-in phases: a clean run exits 0 with the summary, a failing phase stops
 *          the later ones, a missing tool is "skipped (not installed)", a throwing phase becomes a crash finding, a
 *          warning never fails, and `--format json` prints only the findings array.
 * Boundary: test only; `CHECK_PHASES` is replaced, so no tool runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0282 (decision 3); ADR 0022 (test placement).
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { captureIo } from "#node/functions/capture-io.function";
import { runCheck } from "#node/functions/run-check.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";
import type { CliContext } from "#node/types/cli-context.type";

const state = vi.hoisted(() => ({ phases: [] as CheckPhase[] }));

vi.mock("#node/constants/check-phases.constant", () => ({
  get CHECK_PHASES() {
    return state.phases;
  },
}));

/** A stand-in phase that resolves with `run`'s outcome. */
const phase = (name: string, run: CheckPhase["run"]): CheckPhase => ({
  name,
  tool: name,
  adr: null,
  run,
});

/** Runs `stackra check` with `values` in an empty folder and returns the exit code and the output. */
async function check(values: CliContext["values"]): Promise<{ code: number; text: string }> {
  const { io, output } = captureIo();
  const code = await runCheck(
    {
      cwd: mkdtempSync(join(tmpdir(), "check-")),
      io,
      values,
      positionals: [],
      rest: [],
      cli: async () => 0,
    },
    {},
  );
  return { code, text: output() };
}

describe("runCheck", () => {
  it("exits 0 and prints the summary when every phase passes or is skipped", async () => {
    state.phases = [
      phase("config", async () => ({ findings: [] })),
      phase("spelling", async () => ({ findings: [], skipped: "not installed" })),
    ];
    const { code, text } = await check({ only: "config,spelling" });
    expect(code).toBe(0);
    expect(text).toMatch(/config\s+passed/);
    expect(text).toMatch(/spelling\s+skipped \(not installed\)/);
  });

  it("prints findings by phase, fails, and does not run the phases after a failure", async () => {
    const later = vi.fn(async () => ({ findings: [] }));
    state.phases = [
      phase("format", async () => ({
        findings: [
          toolFinding(
            { name: "format", tool: "oxfmt", adr: null },
            { rule: "format", path: "a.ts", message: "x", fixable: true },
          ),
        ],
      })),
      phase("lint", later),
    ];
    const { code, text } = await check({ only: "format,lint" });
    expect(code).toBe(1);
    expect(text).toContain("\nformat\na.ts  oxfmt/format  x  [fixable]\n");
    expect(text).toMatch(/lint\s+not run/);
    expect(later).not.toHaveBeenCalled();
  });

  it("runs every phase after a failure with --keep-going and still exits 1", async () => {
    const later = vi.fn(async () => ({ findings: [] }));
    state.phases = [
      phase("format", async () => ({
        findings: [
          toolFinding(
            { name: "format", tool: "oxfmt", adr: null },
            { rule: "format", message: "x" },
          ),
        ],
      })),
      phase("lint", later),
    ];
    const { code, text } = await check({ only: "format,lint", "keep-going": true });
    expect(code).toBe(1);
    expect(later).toHaveBeenCalledOnce();
    expect(text).toMatch(/lint\s+passed/);
  });

  it("reports a gen finding lint already reported on the same file once", async () => {
    state.phases = [
      phase("lint", async () => ({
        findings: [
          toolFinding(
            { name: "lint", tool: "oxlint", adr: null },
            { rule: "stackra(one-declaration-per-file)", path: "a.ts", message: "split" },
          ),
        ],
      })),
      phase("gen", async () => ({
        findings: [
          toolFinding(
            { name: "gen", tool: "gen", adr: null },
            { rule: "two_declarations_in_file", path: "a.ts", message: "two" },
          ),
        ],
      })),
    ];
    const { text } = await check({ only: "lint,gen", "keep-going": true, format: "json" });
    expect(JSON.parse(text)).toEqual([
      expect.objectContaining({
        rule: "stackra(one-declaration-per-file)",
        message: "split (gen two_declarations_in_file agrees)",
      }),
    ]);
  });

  it("turns a throwing phase into a crash finding and keeps warnings from failing", async () => {
    state.phases = [
      phase("lint", async () => ({
        findings: [
          toolFinding(
            { name: "lint", tool: "oxlint", adr: null },
            { rule: "r", message: "w", severity: "warning" },
          ),
        ],
      })),
      phase("docs", async () => {
        throw new Error("boom");
      }),
    ];
    const { code, text } = await check({ only: "lint,docs" });
    expect(code).toBe(1);
    expect(text).toMatch(/lint\s+passed/);
    expect(text).toContain("docs/crash  boom");
  });

  it("prints only a JSON array of findings with --format json", async () => {
    state.phases = [
      phase("config", async () => ({
        findings: [
          toolFinding(
            { name: "config", tool: "repo-checks", adr: null },
            { rule: "json-configs", path: "x.json", message: "convert (ADR 0007)" },
          ),
        ],
      })),
    ];
    const { code, text } = await check({ only: "config", format: "json" });
    expect(code).toBe(1);
    expect(JSON.parse(text)).toEqual([
      expect.objectContaining({
        phase: "config",
        rule: "json-configs",
        path: "x.json",
        adr: "0007",
      }),
    ]);
  });
});
