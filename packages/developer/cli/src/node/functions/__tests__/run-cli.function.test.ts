/**
 * Stackra file contract:
 * Purpose: unit tests of `runCli`: help and version, an unknown command (2), option parsing with `--` passthrough,
 *          per-command help, usage errors (2), failures (1), and `cli` in the context running another command.
 * Boundary: test only; runs fake commands, never a tool.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 3 and 5).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { COMMANDS } from "#node/constants/commands.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { cliVersion } from "#node/functions/cli-version.function";
import { helpText } from "#node/functions/help-text.function";
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

const commands = [echo, failing, misused];

const run = async (args: readonly string[], cwd = "/repo") => {
  const { io, output } = captureIo();
  const code = await runCli(args, io, { cwd, commands });
  return { code, output: output() };
};

describe("runCli", () => {
  it("prints help with no command, --help, -h and help", async () => {
    for (const args of [[], ["--help"], ["-h"], ["help"]]) {
      expect(await run(args)).toEqual({ code: 0, output: helpText(commands) });
    }
  });

  it("prints the version", async () => {
    expect(await run(["--version"])).toEqual({ code: 0, output: `${cliVersion()}\n` });
  });

  it("refuses an unknown command with 2", async () => {
    const { code, output } = await run(["deploy"]);
    expect(code).toBe(2);
    expect(output).toContain("unknown command: deploy");
  });

  it("parses options and positionals and passes everything after -- untouched", async () => {
    const { code, output } = await run(["echo", "--loud", "a", "--", "--x", "b"]);
    expect(code).toBe(0);
    expect(JSON.parse(output)).toEqual({ loud: true, positionals: ["a"], rest: ["--x", "b"] });
  });

  it("prints a command's help", async () => {
    expect(await run(["echo", "--help"])).toEqual({
      code: 0,
      output: "Echo the input\n\nUsage: stackra echo [--loud] [words…] [-- rest…]\n",
    });
  });

  it("turns an unknown option or a CliUsageError into 2 with the usage", async () => {
    const unknown = await run(["echo", "--quiet"]);
    expect(unknown.code).toBe(2);
    expect(unknown.output).toContain("Usage: stackra echo");
    const misuse = await run(["misuse"]);
    expect(misuse).toEqual({
      code: 2,
      output: "stackra misuse: bad line\nUsage: stackra misuse\n",
    });
  });

  it("turns any other error into 1", async () => {
    expect(await run(["fail"])).toEqual({ code: 1, output: "stackra fail: boom\n" });
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

  it("defaults to the CLI's own commands", async () => {
    const { io, output } = captureIo();
    expect(await runCli(["--help"], io)).toBe(0);
    expect(output()).toBe(helpText(COMMANDS));
  });
});
