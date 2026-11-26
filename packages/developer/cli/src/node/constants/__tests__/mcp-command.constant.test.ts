/**
 * Stackra file contract:
 * Purpose: unit tests of `MCP_COMMAND`: it serves the local MCP with the CLI version and the working directory, adds
 *          the CLI's own read-only tool commands (`doctor`, `ls`), and its runner runs the CLI in-process with a
 *          capturing io, in the folder a tool names, returning the exit code and the output. And the local MCP's
 *          built-in tools promise only what the CLI does: every kind of `new` and every phase of `check` is one the
 *          CLI has (and none it has is missing), and every option a tool passes is a flag of the CLI command it runs.
 * Boundary: test only; `serveLocalMcp` is replaced by a fake, so no stdio server starts; the tool schemas are read
 *           from the real `DEV_TOOL_COMMANDS` and the CLI's own command definitions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2873.
 */
import { readCommand, toolsOf, type CommandClass } from "@stackra/console";
import { DEV_TOOL_COMMANDS, serveLocalMcp } from "@stackra/mcp/node";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CHECK_PHASES } from "#node/constants/check-phases.constant";
import { COMMANDS } from "#node/constants/commands.constant";
import { MCP_COMMAND } from "#node/constants/mcp-command.constant";
import { NEW_COMMAND } from "#node/constants/new-command.constant";
import { captureIo } from "#node/functions/capture-io.function";
import { cliVersion } from "#node/functions/cli-version.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { CliIo } from "#node/types/cli-io.type";

vi.mock("@stackra/mcp/node", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serveLocalMcp: vi.fn(async () => undefined),
}));

/** The local MCP's built-in tools, as `serveLocalMcp` serves them. */
const BUILT_IN = toolsOf(
  { name: "stackra", version: "0", commands: DEV_TOOL_COMMANDS },
  { cwd: "/repo" },
);

/** The input properties of a built-in tool. */
const propertiesOf = (name: string) =>
  (
    (BUILT_IN.find((tool) => tool.name === name)?.inputSchema ?? {}) as {
      properties?: Record<string, { enum?: string[]; items?: { enum?: string[] } }>;
    }
  ).properties ?? {};

/** The long flags the CLI command `name` takes. */
function cliFlags(name: string): string[] {
  const command = COMMANDS.find((entry) =>
    typeof entry === "function"
      ? readCommand(entry as CommandClass).name === name
      : (entry as CliCommand).name === name,
  );
  if (command === undefined) throw new Error(`stackra has no ${name} command`);
  if (typeof command === "function")
    return readCommand(command as CommandClass).options.map((field) => field.flag);
  return Object.keys((command as CliCommand).options ?? {});
}

/** `dryRun` as the CLI writes it, `dry-run`. */
const kebab = (property: string): string =>
  property.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

describe("MCP_COMMAND", () => {
  it("serves the local MCP with the CLI version, the root, its tool commands and an in-process runner", async () => {
    const cli = vi.fn(
      async (_args: readonly string[], io: CliIo, _at?: { readonly cwd?: string }) => {
        io.out("checked\n");
        return 3;
      },
    );
    expect(MCP_COMMAND.name).toBe("mcp");
    expect(
      await MCP_COMMAND.run({
        cwd: "/repo",
        io: captureIo().io,
        values: {},
        positionals: [],
        rest: [],
        cli,
      }),
    ).toBe(0);
    const options = vi.mocked(serveLocalMcp).mock.calls[0]?.[0];
    expect(options?.version).toBe(cliVersion());
    expect(options?.root).toBe("/repo");
    // doctor and ls are served from their own command definitions, read-only.
    expect(options?.tools?.map((tool) => [tool.name, tool.readOnly])).toEqual([
      ["doctor", true],
      ["ls", true],
    ]);
    expect(await options?.run?.(["gen", "--check"])).toEqual({ exitCode: 3, output: "checked\n" });
    expect(cli.mock.calls[0]?.[0]).toEqual(["gen", "--check"]);
    expect(cli.mock.calls[0]?.[1].inherit).toBe(false);
    // A tool that names a member runs the CLI in that member's folder.
    await options?.run?.(["test"], { cwd: "/repo/services/commerce" });
    expect(cli.mock.calls[1]?.[2]).toEqual({ cwd: "/repo/services/commerce" });
  });
});

describe("the local MCP's built-in tools", () => {
  it("offer exactly the kinds stackra new makes", async () => {
    // `stackra new` with no kind names every kind it makes.
    const refusal = await Promise.resolve(
      NEW_COMMAND.run({
        cwd: "/repo",
        io: captureIo().io,
        values: {},
        positionals: [],
        rest: [],
        cli: vi.fn(),
      }),
    ).catch((error: unknown) => (error as Error).message);
    const kinds = String(refusal)
      .replace(/^name the kind: /, "")
      .split(", ");
    const offered = propertiesOf("new")["kind"]?.enum ?? [];
    expect(kinds.length).toBeGreaterThan(2);
    expect(offered).toHaveLength(kinds.length);
    expect(new Set(offered)).toEqual(new Set(kinds));
  });

  it("offer exactly the phases stackra check runs", () => {
    const phases = CHECK_PHASES.map((phase) => phase.name);
    expect(propertiesOf("check")["only"]?.items?.enum).toEqual(phases);
    expect(propertiesOf("check")["skip"]?.items?.enum).toEqual(phases);
  });

  it("pass only flags the CLI command they run takes", () => {
    // `member` picks the folder the command runs in; `kind` and `name` are `new`'s positionals.
    const notFlags = new Set(["member", "kind", "name"]);
    const runs = ["new", "gen", "validate", "check", "verify", "test", "typecheck", "lint"];
    expect(BUILT_IN.map((tool) => tool.name)).toEqual(expect.arrayContaining(runs));
    for (const name of runs) {
      const flags = cliFlags(name);
      for (const property of Object.keys(propertiesOf(name)).filter((key) => !notFlags.has(key)))
        expect(flags, `${name} --${kebab(property)}`).toContain(kebab(property));
    }
  });
});
