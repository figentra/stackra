/**
 * Stackra file contract:
 * Purpose: unit tests of `runCli` on `@stackra/console`: a legacy command runs byte-identical and exits as before
 *          (usage error 2, failure 1), `--help` and `help <command>` never run a command, an unknown command exits 2
 *          naming the closest, the version, spaced command names, `cli` in the context running another command, the
 *          list of commands still on passthrough pinned, and a member's own console command run by its name with its
 *          flags (STA-2888): listed under its member, never over a `stackra` command.
 * Boundary: test only; runs fake commands, never a tool.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 3 and 5); ADR 0500 (decision 7); STA-1966;
 *                     STA-2888.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readCommand } from "@stackra/console";
import { passthroughCommands } from "@stackra/console/testing";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayCommand } from "#node/commands/runway.command";
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

describe("runCli with member commands (STA-2888)", () => {
  let root = "";

  /** A workspace whose services/orders declares `names` and runs them through a console entry returning 9. */
  const workspace = (names: readonly string[]): string => {
    root = mkdtempSync(join(tmpdir(), "stackra-run-cli-"));
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
    const orders = join(root, "services", "orders");
    mkdirSync(join(orders, ".stackra", "entry"), { recursive: true });
    writeFileSync(join(orders, "package.json"), JSON.stringify({ name: "@acme/service-orders" }));
    writeFileSync(join(orders, "stackra.config.ts"), "export default defineService({});\n");
    const rows = names.map((name) => ({
      name,
      aliases: [],
      hidden: false,
      audit: false,
      bin: false,
      class: "Probe",
      file: "src/probe.command.ts",
      entry: "core",
    }));
    writeFileSync(join(orders, "stackra.manifest.json"), JSON.stringify({ commands: rows }));
    writeFileSync(
      join(orders, ".stackra", "entry", "console.ts"),
      [
        "export const run = async (argv: readonly string[]): Promise<number> => {",
        "  (globalThis as { ordersArgv?: unknown }).ordersArgv = [...argv];",
        "  return 9;",
        "};",
        "",
      ].join("\n"),
    );
    return root;
  };

  const runIn = async (args: readonly string[]) => {
    const { io, output } = captureIo();
    const code = await runCli(args, io, { cwd: root, commands });
    return { code, output: output() };
  };

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    delete (globalThis as { ordersArgv?: unknown }).ordersArgv;
  });

  // @covers sta-2888:FR-001
  it("runs a member command by its own name with its flags, no console <member> and no --", async () => {
    workspace(["db:status"]);
    const { code } = await runIn(["db:status", "--json", "--tenant", "acme"]);
    expect(code).toBe(9);
    expect((globalThis as { ordersArgv?: unknown }).ordersArgv).toEqual([
      "db:status",
      "--json",
      "--tenant",
      "acme",
    ]);
  });

  // @covers sta-2888:FR-005
  it("lists the member commands under their member", async () => {
    workspace(["db:status", "orders:sync"]);
    const { code, output } = await runIn([]);
    expect(code).toBe(0);
    expect(output).toMatch(
      /services\/orders\n\s+db:status\s+Member command \(services\/orders\)\n\s+orders:sync/,
    );
    expect(output).toContain("echo");
  });

  // @covers sta-2888:FR-004
  it("never lets a member command take a stackra command's name", async () => {
    workspace(["echo", "db:status"]);
    const { code, output } = await runIn(["echo", "a"]);
    expect(code).toBe(0);
    expect(output).toBe('{"loud":false,"positionals":["a"],"rest":[]}\n');
    expect((globalThis as { ordersArgv?: unknown }).ordersArgv).toBeUndefined();
  });

  it("still refuses a name no command and no member takes, naming the closest of both", async () => {
    workspace(["db:status"]);
    const { code, output } = await runIn(["db:statsu"]);
    expect(code).toBe(2);
    expect(output).toContain("db:status");
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
    // `stackra runway` mounts Runway's own console (ADR 0529 decision 4): a passthrough by design, not a legacy command.
    const classes = COMMANDS.filter((command) => command !== RunwayCommand).map((command) =>
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
