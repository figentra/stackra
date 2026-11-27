/**
 * Stackra file contract:
 * Purpose: unit tests of `toolRun`, `runToolCommand` and `diagnosticsOf`: a run goes through the host's runner in the
 *          root or the member's folder, its output loses its colour codes and keeps the tail past the limit, while the
 *          parsers see all of it; a tool command built without the server's host refuses; diagnostics are counted
 *          and capped, errors first.
 * Boundary: test only; a fake host.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2873.
 */
import { join } from "node:path";

import type { CommandIo } from "@stackra/console";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DevToolHost } from "#core/ports/dev-tool-host.port";
import { OUTPUT_LIMIT } from "#node/constants/output-limit.constant";
import { diagnosticsOf } from "#node/functions/diagnostics-of.function";
import { runToolCommand } from "#node/functions/run-tool-command.function";
import { toolRun } from "#node/functions/tool-run.function";
import type { Diagnostic } from "#node/types/diagnostic.type";

/** A host whose runner answers `output` with `exitCode`. */
function hostOf(output: string, exitCode = 0) {
  const run = vi.fn(async () => ({ exitCode, output }));
  const host = new (class extends DevToolHost {
    run = run;

    environment() {
      return {};
    }
  })();
  return { host, run };
}

describe("toolRun", () => {
  it("runs in the member's folder and strips colour codes", async () => {
    const { host, run } = hostOf("\u001B[32mok\u001B[39m\n", 0);
    const { result, output } = await toolRun(host, "/repo", ["lint"], {
      name: "@acme/commerce",
      dir: "services/commerce",
      path: "/repo/services/commerce",
    });
    expect(run).toHaveBeenCalledWith(["lint"], { cwd: join("/repo", "services/commerce") });
    expect(output).toBe("ok\n");
    expect(result).toMatchObject({
      command: "stackra lint",
      cwd: "services/commerce",
      exitCode: 0,
      ok: true,
      output: "ok\n",
    });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("keeps the tail of a long output and hands the parsers all of it", async () => {
    const long = `${"x".repeat(OUTPUT_LIMIT)}FAIL at the end`;
    const { host, run } = hostOf(long, 1);
    const { result, output } = await toolRun(host, "/repo", ["test"]);
    expect(run).toHaveBeenCalledWith(["test"], undefined);
    expect(output).toBe(long);
    expect(result.ok).toBe(false);
    expect(result.output.startsWith("… (15 earlier characters cut)\n")).toBe(true);
    expect(result.output.endsWith("FAIL at the end")).toBe(true);
  });
});

describe("runToolCommand", () => {
  it("refuses outside the local MCP", async () => {
    await expect(
      runToolCommand({ cwd: "/repo" } as CommandIo, undefined, ["lint"]),
    ).rejects.toMatchObject({
      message: "This tool runs inside the local MCP only",
      fix: "stackra mcp",
    });
  });
});

describe("diagnosticsOf", () => {
  it("counts errors and warnings and lists at most 200, errors first", () => {
    const warning: Diagnostic = { file: "a.ts", severity: "warning", message: "w" };
    const error: Diagnostic = { file: "b.ts", severity: "error", message: "e" };
    const summary = diagnosticsOf([...Array.from({ length: 250 }, () => warning), error]);
    expect(summary).toMatchObject({ errors: 1, warnings: 250, truncated: true });
    expect(summary.diagnostics).toHaveLength(200);
    expect(summary.diagnostics[0]).toBe(error);
    expect(diagnosticsOf([warning])).toEqual({ errors: 0, warnings: 1, diagnostics: [warning] });
  });
});
