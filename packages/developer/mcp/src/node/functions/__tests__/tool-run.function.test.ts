/**
 * Stackra file contract:
 * Purpose: unit tests of `toolRun`, `runToolCommand` and `diagnosticsOf`: a run goes through the host's runner in the
 *          root or the member's folder, its output loses its colour codes and keeps the tail past the limit, while the
 *          parsers see all of it; a tool command built without the server's host refuses; a run writes its full log
 *          and names it, its findings are counted and capped (errors first) with a member's files from the root, and a
 *          failed run that printed no error gets a `command_failed` diagnostic pointing at the log.
 * Boundary: test only; a fake host.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2873; STA-2886.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { CommandIo } from "@stackra/console";
import type { Diagnostic } from "@stackra/console/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DevToolHost } from "#core/ports/dev-tool-host.port";
import { OUTPUT_LIMIT } from "#node/constants/output-limit.constant";
import { diagnosticsOf } from "#node/functions/diagnostics-of.function";
import { runToolCommand } from "#node/functions/run-tool-command.function";
import { toolRun } from "#node/functions/tool-run.function";

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
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "stackra-tool-run-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  /** Runs `args` through a host answering `output`, and resolves with the exit code and the `--json` data. */
  async function runWith(
    output: string,
    exitCode: number,
    args: readonly string[],
    options: Parameters<typeof runToolCommand>[3] = {},
  ) {
    const { host } = hostOf(output, exitCode);
    let data: Record<string, unknown> = {};
    const io = {
      cwd: root,
      output: { json: (value: Record<string, unknown>) => (data = value) },
    } as unknown as CommandIo;
    const code = await runToolCommand(io, host, args, options);
    return { code, data };
  }

  it("writes the full log, names it, and lists the findings counted, errors first", async () => {
    const warning: Diagnostic = { phase: "lint", severity: "warning", file: "a.ts", message: "w" };
    const error: Diagnostic = { phase: "lint", severity: "error", file: "/abs/b.ts", message: "e" };
    const { code, data } = await runWith("\u001B[31mfound 2\u001B[39m\n", 1, ["lint"], {
      read: () => ({ diagnostics: [warning, error], extra: 1 }),
    });
    expect(code).toBe(1);
    expect(data).toMatchObject({
      command: "stackra lint",
      log: ".stackra/logs/last-lint.log",
      extra: 1,
      errors: 1,
      warnings: 1,
      diagnostics: [error, warning],
    });
    expect(readFileSync(join(root, ".stackra/logs/last-lint.log"), "utf8")).toMatch(
      /^\$ stackra lint\n# in \.\nfound 2\n# exit 1 after \d+ ms\n$/,
    );
  });

  it("gives a member's findings their file from the repository root", async () => {
    mkdirSync(join(root, "services/commerce"), { recursive: true });
    writeFileSync(
      join(root, "services/commerce/package.json"),
      JSON.stringify({ name: "@acme/c" }),
    );
    const { data } = await runWith("", 1, ["typecheck"], {
      member: "services/commerce",
      read: () => ({
        diagnostics: [{ phase: "typecheck", severity: "error", file: "./src/a.ts", message: "x" }],
      }),
    });
    expect(data["diagnostics"]).toEqual([
      { phase: "typecheck", severity: "error", file: "services/commerce/src/a.ts", message: "x" },
    ]);
  });

  it("gives a failed run that printed no error one command_failed diagnostic", async () => {
    const { data } = await runWith("building\nError: boom\n\n", 1, ["new", "package", "x"], {
      read: () => ({
        diagnostics: [{ phase: "new", severity: "warning", message: "slow" }],
      }),
    });
    expect(data).toMatchObject({ errors: 1, warnings: 1 });
    expect((data["diagnostics"] as Diagnostic[])[0]).toEqual({
      phase: "new",
      code: "command_failed",
      severity: "error",
      message: "stackra new package x exited 1: Error: boom",
      fix: "read .stackra/logs/last-new.log",
    });
    const passed = await runWith("done\n", 0, ["validate"]);
    expect(passed).toMatchObject({ code: 0, data: { errors: 0, warnings: 0, diagnostics: [] } });
  });

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
    const warning: Diagnostic = { phase: "lint", file: "a.ts", severity: "warning", message: "w" };
    const error: Diagnostic = { phase: "lint", file: "b.ts", severity: "error", message: "e" };
    const summary = diagnosticsOf([...Array.from({ length: 250 }, () => warning), error]);
    expect(summary).toMatchObject({ errors: 1, warnings: 250, truncated: true });
    expect(summary.diagnostics).toHaveLength(200);
    expect(summary.diagnostics[0]).toBe(error);
    expect(diagnosticsOf([warning])).toEqual({ errors: 0, warnings: 1, diagnostics: [warning] });
  });
});
