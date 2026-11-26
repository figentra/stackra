/**
 * Stackra file contract:
 * Purpose: unit tests of `CONSOLE_COMMAND`: it runs the member's console entry with the arguments and returns its exit
 *          code, runs it in the member's folder (STA-2888), finds the member by path or by workspace folder name,
 *          exits 2 and says so when the member has no
 *          console entry, and refuses a missing or unknown member.
 * Boundary: test only; the member is a throwaway folder whose entry is a plain script, run by the real `node`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506 (decision 6); STA-1731 spec FR-009.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { CONSOLE_COMMAND } from "#node/constants/console-command.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import type { CliContext } from "#node/types/cli-context.type";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** A service folder; with `entry`, its generated console entry (TypeScript, loaded through Vite). */
function service(name: string, entry?: string): void {
  const folder = join(root, "services", name);
  mkdirSync(join(folder, ".stackra", "entry"), { recursive: true });
  writeFileSync(
    join(folder, "package.json"),
    JSON.stringify({ name: `@figentra/service-${name}` }),
  );
  if (entry !== undefined) writeFileSync(join(folder, ".stackra", "entry", "console.ts"), entry);
}

const context = (positionals: readonly string[], rest: readonly string[] = []) => {
  const captured = captureIo();
  const run: CliContext = {
    cwd: root,
    io: captured.io,
    values: {},
    positionals,
    rest,
    cli: async () => 0,
  };
  return { run, output: captured.output };
};

describe("CONSOLE_COMMAND", () => {
  it("is `stackra console <member>`", () => {
    expect(CONSOLE_COMMAND.name).toBe("console");
    expect(CONSOLE_COMMAND.positionals).toBe(true);
  });

  // @covers sta-1731:FR-009
  it("runs the member's console entry with the arguments and returns its exit code", async () => {
    // A legacy decorator in the entry: Node's type stripping refuses it, the Vite runner must not.
    service(
      "orders",
      [
        "function mark(_target: object, _key: string): void {}",
        "class Probe {",
        "  @mark field = 1;",
        "}",
        "export const run = async (argv: readonly string[]): Promise<number> => {",
        "  (globalThis as { consoleArgs?: unknown }).consoleArgs = [...argv, new Probe().field];",
        "  return 7;",
        "};",
        "",
      ].join("\n"),
    );
    const { run } = context(["orders", "db:status"], ["--json"]);
    expect(await CONSOLE_COMMAND.run(run)).toBe(7);
    expect((globalThis as { consoleArgs?: unknown }).consoleArgs).toEqual([
      "db:status",
      "--json",
      1,
    ]);
  });

  // @covers sta-1731:FR-009
  // @covers sta-2888:FR-007
  it("runs the member's console in the member's folder from the workspace root, and puts the process back", async () => {
    service(
      "orders",
      [
        "const importedIn = process.cwd();",
        "export const run = async (): Promise<number> => {",
        "  (globalThis as { consoleFolder?: unknown }).consoleFolder = [importedIn, process.cwd()];",
        "  return 0;",
        "};",
        "",
      ].join("\n"),
    );
    const before = process.cwd();
    expect(await CONSOLE_COMMAND.run(context(["orders"]).run)).toBe(0);
    expect((globalThis as { consoleFolder?: unknown }).consoleFolder).toEqual([
      join(root, "services", "orders"),
      join(root, "services", "orders"),
    ]);
    expect(process.cwd()).toBe(before);
  });

  it("finds the member by its path from the working directory too", async () => {
    service("orders", "export const run = async (): Promise<number> => 3;\n");
    expect(await CONSOLE_COMMAND.run(context(["services/orders"]).run)).toBe(3);
  });

  // @covers sta-1731:FR-009
  it("exits 2 and says so when the member has no console entry", async () => {
    service("health");
    const { run, output } = context(["health"]);
    expect(await CONSOLE_COMMAND.run(run)).toBe(2);
    expect(output()).toContain("health has no console entry");
  });

  it("refuses a missing or an unknown member", async () => {
    await expect(CONSOLE_COMMAND.run(context([]).run)).rejects.toBeInstanceOf(CliUsageError);
    await expect(CONSOLE_COMMAND.run(context(["nope"]).run)).rejects.toBeInstanceOf(CliUsageError);
  });
});
