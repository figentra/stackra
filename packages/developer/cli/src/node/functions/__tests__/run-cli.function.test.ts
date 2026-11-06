/**
 * Stackra file contract:
 * Purpose: unit tests of `runCli` on `@stackra/console`: a legacy command runs byte-identical and exits as before
 *          (usage error 2, failure 1), `--help` and `help <command>` never run a command, an unknown command exits 2
 *          naming the closest, the version, spaced command names, `cli` in the context running another command, and the
 *          list of commands still on passthrough pinned.
 * Boundary: test only; runs fake commands, never a tool.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 3 and 5); ADR 0500 (decision 7); STA-1966.
 */
import { readCommand } from "@stackra/console";
import { passthroughCommands } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { COMMANDS } from "#node/constants/commands.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { cliVersion } from "#node/functions/cli-version.function";
import { legacyCommand } from "#node/functions/legacy-command.function";
import { runCli } from "#node/functions/run-cli.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { CliContext } from "#node/types/cli-context.type";

const echo: CliCommand = {
  name: "echo",
  summary: "Echo the input",
  usage: "stackra echo [--loud] [words…] [-- rest…]",
  options: { loud: { type: "boolean" } },
  positionals: true,
  run: async ({ values, positionals, rest, io }) => {
    io.out(`${JSON.stringify({ loud: values["loud"] === true, positionals, rest })}\n`);
    return 0;
  },
};

const failing: CliCommand = {
  name: "fail",
  summary: "Fail",
  usage: "stackra fail",
  run: async () => {
    throw new Error("boom");
  },
};

const misused: CliCommand = {
  name: "misuse",
  summary: "Misuse",
  usage: "stackra misuse",
  run: async () => {
    throw new CliUsageError("bad line");
  },
};

const spaced: CliCommand = {
  name: "mcp sync",
  summary: "Sync",
  usage: "stackra mcp sync",
  run: async ({ io }) => {
    io.out("synced\n");
    return 5;
  },
};

const commands = [echo, failing, misused, spaced];

const run = async (args: readonly string[], cwd = "/repo") => {
  const { io, output } = captureIo();
  const code = await runCli(args, io, { cwd, commands });
  return { code, output: output() };
};

describe("runCli", () => {
  it("runs a legacy command byte-identical: options, positionals and everything after --", async () => {
    const { code, output } = await run(["echo", "--loud", "a", "--", "--x", "b"]);
    expect(code).toBe(0);
    expect(output).toBe('{"loud":true,"positionals":["a"],"rest":["--x","b"]}\n');
  });

  it("runs a spaced command by its words and keeps its own exit code", async () => {
    expect(await run(["mcp", "sync"])).toEqual({ code: 5, output: "synced\n" });
  });

  it("exits 2 with the usage for an unknown option or a CliUsageError, and 1 for a failure", async () => {
    const unknown = await run(["echo", "--quiet"]);
    expect(unknown.code).toBe(2);
    expect(unknown.output).toContain("Usage: stackra echo");
    const misuse = await run(["misuse"]);
    expect(misuse.code).toBe(2);
    expect(misuse.output).toContain("bad line");
    expect(misuse.output).toContain("Usage: stackra misuse");
    const failure = await run(["fail"]);
    expect(failure.code).toBe(1);
    expect(failure.output).toContain("boom");
  });

  it("prints help for --help and help <command> and never runs the command", async () => {
    const spy = vi.fn(async () => 0);
    const guarded: CliCommand = { ...echo, run: spy };
    for (const args of [
      ["echo", "--help"],
      ["help", "echo"],
      ["echo", "-h"],
    ]) {
      const { io, output } = captureIo();
      expect(await runCli(args, io, { cwd: "/repo", commands: [guarded] })).toBe(0);
      expect(output()).toContain("Echo the input");
    }
    expect(spy).not.toHaveBeenCalled();
  });

  it("lists the commands for no command and for --help", async () => {
    for (const args of [[], ["--help"]]) {
      const { code, output } = await run(args);
      expect(code).toBe(0);
      expect(output).toContain("echo");
      expect(output).toContain("mcp:sync");
    }
  });

  it("prints the version", async () => {
    const { code, output } = await run(["--version"]);
    expect(code).toBe(0);
    expect(output).toContain(cliVersion());
  });

  it("refuses an unknown command with 2, naming the closest", async () => {
    const { code, output } = await run(["ecko"]);
    expect(code).toBe(2);
    expect(output).toContain("ecko");
    expect(output).toContain("echo");
  });

  it("gives commands the cwd and a cli that runs another command with the same commands", async () => {
    const seen = vi.fn<(context: CliContext) => void>();
    const outer: CliCommand = {
      name: "outer",
      summary: "Outer",
      usage: "stackra outer",
      run: async (context) => {
        seen(context);
        const inner = captureIo();
        const code = await context.cli(["echo", "x"], inner.io);
        context.io.out(inner.output());
        return code;
      },
    };
    const { io, output } = captureIo();
    expect(await runCli(["outer"], io, { cwd: "/somewhere", commands: [echo, outer] })).toBe(0);
    expect(seen.mock.calls[0]?.[0].cwd).toBe("/somewhere");
    expect(JSON.parse(output())).toEqual({ loud: false, positionals: ["x"], rest: [] });
  });

  it("names a legacy command by its words joined with a colon", () => {
    expect(readCommand(legacyCommand(spaced, async () => 0, false)).name).toBe("mcp:sync");
  });
});

describe("COMMANDS on the console", () => {
  it("lists every command, native or legacy, in its help", async () => {
    const { io, output } = captureIo();
    expect(await runCli(["--help"], io)).toBe(0);
    expect(output()).toContain("doctor");
    expect(output()).toContain("create");
  });

  it("still has these commands on passthrough; the list only goes down (ADR 0500 decision 7)", () => {
    const classes = COMMANDS.map((command) =>
      typeof command === "function" ? command : legacyCommand(command, async () => 0, false),
    );
    // 23 today: every CliCommand not yet a class. Remove a name when its command is converted; never add one.
    expect(passthroughCommands(classes)).toEqual(PASSTHROUGH);
  });
});

/** The legacy commands, sorted: each leaves this list when it becomes a console command class. */
const PASSTHROUGH: string[] = [
  "build",
  "check",
  "code:check",
  "code:fix",
  "console",
  "db:diff",
  "db:seed",
  "deploy",
  "dev",
  "eas-preflight",
  "gen",
  "lint",
  "mcp",
  "mcp:exec",
  "new",
  "preview:serve",
  "seed-pack",
  "start",
  "test",
  "testbed",
  "typecheck",
  "validate",
  "verify",
];
