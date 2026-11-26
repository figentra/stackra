/**
 * Stackra file contract:
 * Purpose: unit tests of `runCli` on `@stackra/console`: a command class running its body prints byte-identical and
 *          exits as before (usage error 2 with the body's usage, failure 1), `--help` and `help <command>` never run
 *          a command, an unknown command exits 2 naming the closest, the version, spaced command names, `cli` in the
 *          context running another command from the same folder, the run's runtime reaching the body (a capture never
 *          takes the terminal), and no command left on passthrough (ADR 0500 decision 7).
 * Boundary: test only; runs fake commands, never a tool.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 3 and 5); ADR 0500 (decision 7); STA-1966;
 *                     STA-2883.
 */
import { Argument, Command, Option, readCommand, type CommandIo } from "@stackra/console";
import { passthroughCommands } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { List } from "@stackra/validation";
import { vi } from "vitest";

import { RunwayCommand } from "#node/commands/runway.command";
import { COMMANDS } from "#node/constants/commands.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { cliVersion } from "#node/functions/cli-version.function";
import { runBody } from "#node/functions/run-body.function";
import { runCli } from "#node/functions/run-cli.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { CliContext } from "#node/types/cli-context.type";

/** A body that prints what it got. */
const ECHO: CliCommand = {
  name: "echo",
  summary: "Echo the input",
  usage: "stackra echo [--loud] [words…]",
  options: { loud: { type: "boolean" } },
  positionals: true,
  run: async ({ values, positionals, rest, io }) => {
    io.out(`${JSON.stringify({ loud: values["loud"] === true, positionals, rest })}\n`);
    return 0;
  },
};

/** Echoes its words. */
class EchoCommand extends Command({
  name: "echo",
  description: ECHO.summary,
}) {
  @Option({ description: "Shout" })
  loud = false;

  @Argument({ description: "The words" })
  @List
  words: string[] = [];

  handle(io: CommandIo): Promise<number> {
    return runBody(io, ECHO, {
      values: { loud: this.loud },
      positionals: this.words,
    });
  }
}

/** A class over `body` with no fields. */
const bare = (name: string, body: CliCommand) =>
  class extends Command({
    name,
    description: body.summary,
  }) {
    handle(io: CommandIo): Promise<number> {
      return runBody(io, body, { values: {} });
    }
  };

const FailCommand = bare("fail", {
  name: "fail",
  summary: "Fail",
  usage: "stackra fail",
  run: async () => {
    throw new Error("boom");
  },
});

const MisuseCommand = bare("misuse", {
  name: "misuse",
  summary: "Misuse",
  usage: "stackra misuse",
  run: async () => {
    throw new CliUsageError("bad line");
  },
});

const SyncCommand = bare("mcp:sync", {
  name: "mcp sync",
  summary: "Sync",
  usage: "stackra mcp sync",
  run: async ({ io }) => {
    io.out("synced\n");
    return 5;
  },
});

const commands = [EchoCommand, FailCommand, MisuseCommand, SyncCommand];

const run = async (args: readonly string[], cwd = "/repo") => {
  const { io, output } = captureIo();
  const code = await runCli(args, io, { cwd, commands });
  return { code, output: output() };
};

describe("runCli", () => {
  // @covers sta-2883:FR-007
  it("runs a command's body byte-identical: options, positionals and the words after --", async () => {
    const { code, output } = await run(["echo", "--loud", "a", "--", "--x", "b"]);
    expect(code).toBe(0);
    expect(output).toBe('{"loud":true,"positionals":["a","--x","b"],"rest":[]}\n');
  });

  it("runs a spaced command by its words and keeps its own exit code", async () => {
    expect(await run(["mcp", "sync"])).toEqual({ code: 5, output: "synced\n" });
  });

  // @covers sta-2883:FR-007
  it("exits 2 with the usage for an unknown option or a CliUsageError, and 1 for a failure", async () => {
    // `--quiet` is the console's own global option, so the unknown one is a flag nothing declares.
    const unknown = await run(["echo", "--whisper"]);
    expect(unknown.code).toBe(2);
    expect(unknown.output).toContain("--whisper");
    const misuse = await run(["misuse"]);
    expect(misuse.code).toBe(2);
    expect(misuse.output).toContain("bad line");
    expect(misuse.output).toContain("Usage: stackra misuse");
    const failure = await run(["fail"]);
    expect(failure.code).toBe(1);
    expect(failure.output).toContain("boom");
  });

  // @covers sta-2883:FR-002
  it("prints help with each option for --help and help <command>, and never runs the command", async () => {
    const spy = vi.spyOn(ECHO, "run");
    for (const args of [
      ["echo", "--help"],
      ["help", "echo"],
      ["echo", "-h"],
    ]) {
      const { code, output } = await run(args);
      expect(code).toBe(0);
      expect(output).toContain("Echo the input");
      expect(output).toContain("--loud");
      expect(output).toContain("Shout");
    }
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
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

  it("gives a body the cwd and a cli that runs another command from the same folder", async () => {
    const seen = vi.fn<(context: CliContext) => void>();
    const OuterCommand = bare("outer", {
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
    });
    const { io, output } = captureIo();
    expect(
      await runCli(["outer"], io, { cwd: "/somewhere", commands: [EchoCommand, OuterCommand] }),
    ).toBe(0);
    expect(seen.mock.calls[0]?.[0].cwd).toBe("/somewhere");
    expect(JSON.parse(output())).toEqual({ loud: false, positionals: ["x"], rest: [] });
  });

  // @covers sta-2883:FR-007
  it("lets a body's tools take the terminal only when the caller has one", async () => {
    const inherits: boolean[] = [];
    const ToolCommand = bare("tool", {
      name: "tool",
      summary: "Tool",
      usage: "stackra tool",
      run: async ({ io }) => {
        inherits.push(io.inherit);
        return 0;
      },
    });
    const captured = captureIo();
    await runCli(["tool"], captured.io, { cwd: "/repo", commands: [ToolCommand] });
    await runCli(
      ["tool"],
      { ...captured.io, inherit: true },
      { cwd: "/repo", commands: [ToolCommand] },
    );
    await runCli(
      ["tool", "--json"],
      { ...captured.io, inherit: true },
      {
        cwd: "/repo",
        commands: [ToolCommand],
      },
    );
    expect(inherits).toEqual([false, true, false]);
  });

  it("names a command class by its words joined with a colon", () => {
    expect(readCommand(SyncCommand).name).toBe("mcp:sync");
  });
});

describe("COMMANDS on the console", () => {
  it("lists the day-one commands in its help", async () => {
    const { io, output } = captureIo();
    expect(await runCli(["--help"], io)).toBe(0);
    for (const name of ["create", "new", "gen", "dev", "test", "check"])
      expect(output()).toContain(name);
  });

  // @covers sta-2883:FR-001
  it("has no command left on passthrough (ADR 0500 decision 7)", () => {
    // `stackra runway` mounts Runway's own console (ADR 0529 decision 4): a passthrough by design, not a legacy command.
    expect(passthroughCommands(COMMANDS)).toEqual(["runway"]);
    expect(passthroughCommands(COMMANDS.filter((command) => command !== RunwayCommand))).toEqual(
      [],
    );
  });
});
