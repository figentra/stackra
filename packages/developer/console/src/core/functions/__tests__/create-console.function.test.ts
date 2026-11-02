/**
 * Stackra file contract:
 * Purpose: proves the kernel end to end through the test harness: list, help, version, dispatch with filled fields,
 *          exit codes, the container lifecycle, signals, prompts (interactive, defaulted, refused, cancelled), the
 *          error screen and `--json`.
 * Boundary: unit test in-process; no terminal.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-008, FR-012 to FR-016, FR-019, FR-022, FR-023, FR-025 and SC-003; STA-1966
 *                     spec FR-001, FR-009, FR-011, FR-013 to FR-015, FR-019, FR-021 and FR-030; ADR 0022.
 */
// @covers sta-1730:FR-008 sta-1730:FR-012 sta-1730:FR-013 sta-1730:FR-014 sta-1730:FR-016 sta-1730:FR-019
// @covers sta-1730:FR-022 sta-1730:FR-023 sta-1730:FR-025 sta-1730:SC-003
// @covers sta-1966:FR-013 sta-1966:FR-014 sta-1966:FR-015 sta-1966:FR-001 sta-1966:FR-009 sta-1966:FR-011
// @covers sta-1966:FR-019 sta-1966:FR-021 sta-1966:FR-030 sta-1966:AC-001 sta-1966:AC-004
import { Int } from "@stackra/validation";

import { Command } from "#core/bases/command.base";
import { Argument } from "#core/decorators/argument.decorator";
import { Option } from "#core/decorators/option.decorator";
import { TextRendererDriver } from "#core/drivers/text-renderer.driver";
import { CommandError } from "#core/errors/command-error.error";
import { PromptCancelledError } from "#core/errors/prompt-cancelled.error";
import { createConsole } from "#core/functions/create-console.function";
import type { CommandIo } from "#core/types/command-io.type";
import type { ConsoleContainer } from "#core/types/console-container.type";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

/** Greets, returning its data. */
class GreetCommand extends Command({
  name: "greet",
  description: "Greet someone",
}) {
  @Argument({ optional: true })
  who?: string;

  @Option({ short: "t" })
  @Int({
    min: 1,
    max: 3,
  })
  times = 1;

  async handle(io: CommandIo) {
    const who = this.who ?? (await io.prompt.text({ message: "Who?", default: "world" }));
    for (let time = 0; time < this.times; time += 1) io.output.success(`Hello ${who}`);
    return { who };
  }
}

/** Asks a question with no default. */
class AskCommand extends Command({
  name: "ask:name",
  description: "Ask a name",
}) {
  async handle(io: CommandIo) {
    io.output.info(await io.prompt.text({ message: "Your name?", option: "name" }));
  }
}

/** Returns the exit code it is given. */
class ExitCommand extends Command({
  name: "exit",
  description: "Exit with a code",
  hidden: true,
}) {
  @Argument
  @Int
  code!: number;

  handle() {
    return this.code;
  }
}

/** Throws an error with a cause. */
class BoomCommand extends Command({
  name: "boom",
  description: "Fail",
}) {
  handle(): never {
    throw new Error("It broke", { cause: new Error("The disk is full") });
  }
}

/** Waits until it is stopped. */
class WaitCommand extends Command({
  name: "wait",
  description: "Wait",
}) {
  handle(io: CommandIo) {
    return new Promise<number>((resolve) => {
      io.signal.addEventListener("abort", () => resolve(0));
    });
  }
}

/** Cancels its own prompt. */
class CancelCommand extends Command({
  name: "cancel",
  description: "Cancel",
}) {
  handle(): never {
    throw new PromptCancelledError("Sure?");
  }
}

/** Counts its runs; grouped, with examples and a docs link. */
class DoctorCommand extends Command({
  name: "doctor",
  description: "Check the machine",
  group: "Machine",
  docs: "https://stackra.dev/cli/doctor",
  examples: ["acme doctor --json"],
}) {
  static runs = 0;

  handle() {
    DoctorCommand.runs += 1;
  }
}

/** A doctor: checklist rows with a field of its own, one failing. */
class CheckCommand extends Command({
  name: "check",
  description: "Run the checks",
}) {
  @Option
  pass = false;

  handle(io: CommandIo) {
    io.output.checklist({
      rows: [
        { name: "node", status: "ok" },
        { name: "git", status: "fail", fix: "brew install git", run: ["brew", "install", "git"] },
      ],
    });
    return this.pass ? 0 : undefined;
  }
}

/** Fails with a reason, a fix and the command's docs link. */
class CloneCommand extends Command({
  name: "clone",
  description: "Clone",
  docs: "https://stackra.dev/cli/clone",
}) {
  handle(): never {
    throw new CommandError("Not a git repository", { why: "/tmp has no .git", fix: "git init" });
  }
}

/** Returns records and writes nothing. */
class RowsCommand extends Command({
  name: "rows",
  description: "Return rows",
}) {
  handle() {
    return [{ name: "a", size: 1 }];
  }
}

const COMMANDS = [
  CheckCommand,
  CloneCommand,
  RowsCommand,
  GreetCommand,
  AskCommand,
  ExitCommand,
  BoomCommand,
  WaitCommand,
  CancelCommand,
  DoctorCommand,
];
const run = (argv: string[], options?: Parameters<typeof runCommandForTest>[2]) =>
  runCommandForTest({ name: "acme", version: "1.2.3", commands: COMMANDS }, argv, options);

describe("createConsole", () => {
  it("lists the visible commands by namespace, without a banner off a terminal", async () => {
    const result = await run([]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("acme <command> [options] [arguments]");
    expect(result.stdout).toMatch(/greet\s+Greet someone/);
    expect(result.stdout).toMatch(/ ask\n\s+ask:name\s+Ask a name/);
    expect(result.stdout).not.toContain("exit");
    expect(result.stdout).not.toContain("|___/");
  });

  it("starts the list with the name and version off a terminal, and groups by group", async () => {
    const result = await run([]);
    expect(result.stdout.split("\n")[0]).toBe("Stackra 1.2.3");
    expect(result.stdout).toMatch(/ Machine\n\s+doctor\s+Check the machine/);
    expect(result.stdout).toContain('Run "acme help <command>"');
  });

  it("prints help for `help <cmd>` and `--help` without running the command", async () => {
    DoctorCommand.runs = 0;
    for (const argv of [
      ["help", "doctor"],
      ["doctor", "--help"],
      ["doctor", "-h"],
    ]) {
      const result = await run(argv);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("acme doctor [options]");
      expect(result.stdout).toContain("Examples:");
      expect(result.stdout).toContain("acme doctor --json");
      expect(result.stdout).toContain("Docs: https://stackra.dev/cli/doctor");
    }
    expect(DoctorCommand.runs).toBe(0);
  });

  it("returns 2 for `help` with an unknown name, naming the closest", async () => {
    const result = await run(["help", "docter"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("Did you mean doctor?");
  });

  it("shows the banner on a colour terminal, in true colour", async () => {
    const result = await run([], { colour: true });
    expect(result.stdout).toContain("\u001B[38;2;");
    expect(result.stdout).toContain("Stackra");
  });

  it("prints a command's help without running it", async () => {
    const result = await run(["greet", "--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("acme greet [options] [<who>]");
    expect(result.stdout).toContain("-t, --times=TIMES");
    expect(result.stdout).toContain("[default: 1]");
  });

  it("prints the version", async () => {
    expect((await run(["--version"])).stdout).toContain("1.2.3");
  });

  it("fills the fields and runs the handler", async () => {
    const result = await run(["greet", "Ada", "-t", "2"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.match(/Hello Ada/g)).toHaveLength(2);
  });

  it("returns the handler's exit code, and 1 for one out of range", async () => {
    expect((await run(["exit", "7"])).exitCode).toBe(7);
    expect((await run(["exit", "300"])).exitCode).toBe(1);
  });

  it("returns 2 on a usage error, with the error screen and suggestions", async () => {
    const result = await run(["gret"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("ERROR");
    expect(result.stderr).toContain("Did you mean greet?");
  });

  it("ends with 1 on a failed checklist row, emitting the rows unchanged under --json", async () => {
    expect((await run(["check"])).exitCode).toBe(1);
    expect((await run(["check", "--pass"])).exitCode).toBe(0);
    const json = await run(["check", "--json"]);
    expect(json.exitCode).toBe(1);
    expect(json.json).toEqual({
      ok: false,
      data: [
        { name: "node", status: "ok" },
        { name: "git", status: "fail", fix: "brew install git", run: ["brew", "install", "git"] },
      ],
    });
  });

  it("draws a command error as one problem, and carries its fields in the --json error", async () => {
    const text = await run(["clone"]);
    expect(text.exitCode).toBe(1);
    expect(text.stderr).toContain("Not a git repository");
    expect(text.stderr).toMatch(/Why\s+\/tmp has no \.git/);
    expect(text.stderr).toMatch(/Fix\s+git init/);
    expect(text.stderr).toMatch(/Docs\s+https:\/\/stackra\.dev\/cli\/clone/);
    expect((await run(["clone", "--json"])).json).toEqual({
      ok: false,
      error: {
        code: "command",
        message: "Not a git repository",
        why: "/tmp has no .git",
        fix: "git init",
        docs: "https://stackra.dev/cli/clone",
      },
    });
  });

  it("presents returned data when the command wrote nothing", async () => {
    const result = await run(["rows"]);
    expect(result.stdout).toMatch(/name\s+size/);
    expect((await run(["rows", "--json"])).json).toEqual({
      ok: true,
      data: [{ name: "a", size: 1 }],
    });
  });

  it("runs every command unchanged on another renderer driver", async () => {
    const seen: string[] = [];
    /** Records each message before drawing it as text. */
    class RecordingRenderer extends TextRendererDriver {
      override message(...args: Parameters<TextRendererDriver["message"]>): void {
        seen.push(args[1]);
        super.message(...args);
      }
    }
    const result = await run(["greet", "Ada"], {
      renderer: (context) => new RecordingRenderer(context),
    });
    expect(result.exitCode).toBe(0);
    expect(seen).toEqual(["Hello Ada"]);
  });

  it("returns 1 when the handler throws, with the causes under --verbose", async () => {
    const quiet = await run(["boom"]);
    expect(quiet.exitCode).toBe(1);
    expect(quiet.stderr).toContain("It broke");
    expect(quiet.stderr).not.toContain("The disk is full");
    expect((await run(["boom", "-v"])).stderr).toContain("Caused by: The disk is full");
  });

  it("asks a prompt when interactive", async () => {
    const result = await run(["greet"], { answers: ["Grace"] });
    expect(result.asked).toEqual(["Who?"]);
    expect(result.stdout).toContain("Hello Grace");
  });

  it("takes a prompt's default when not interactive (CI, --no-interaction, --json)", async () => {
    expect((await run(["greet"], { env: { CI: "1" } })).stdout).toContain("Hello world");
    expect((await run(["greet", "-n"], { answers: ["Grace"] })).stdout).toContain("Hello world");
  });

  it("refuses a prompt with no default when not interactive, naming its option", async () => {
    const result = await run(["ask:name"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("Pass --name");
  });

  it("returns 130 when a prompt is cancelled", async () => {
    expect((await run(["cancel"])).exitCode).toBe(130);
  });

  it("returns 130 on SIGINT and 143 on SIGTERM", async () => {
    expect((await run(["wait"], { signal: "SIGINT" })).exitCode).toBe(130);
    expect((await run(["wait"], { signal: "SIGTERM" })).exitCode).toBe(143);
  });

  it("writes one JSON document with --json", async () => {
    expect((await run(["greet", "Ada", "--json"])).json).toEqual({
      ok: true,
      data: { who: "Ada" },
    });
    const failed = await run(["greet", "Ada", "-t", "9", "--json"]);
    expect(failed.exitCode).toBe(2);
    expect(failed.json).toEqual({
      ok: false,
      error: { code: "usage", message: "--times must be at most 3, got 9" },
    });
    expect(failed.stderr).toBe("");
  });

  it("writes no escape byte without a terminal, under NO_COLOR or in CI", async () => {
    for (const env of [{}, { NO_COLOR: "1" }, { CI: "1" }])
      expect((await run(["greet", "Ada"], { env })).stdout).not.toContain("\u001B");
  });

  it("creates the container only to dispatch, resolves from it and closes it", async () => {
    const events: string[] = [];
    const container: ConsoleContainer = {
      get: <T extends object>(type: abstract new (...args: never[]) => T) => {
        events.push("get");
        return Reflect.construct(type, []) as T;
      },
      close: async () => {
        events.push("close");
      },
    };
    const factory = () => {
      events.push("create");
      return container;
    };
    await run(["greet", "--help"], { container: factory });
    expect(events).toEqual([]);
    await run(["greet", "Ada"], { container: factory });
    await run(["boom"], { container: factory });
    expect(events).toEqual(["create", "get", "close", "create", "get", "close"]);
  });

  it("returns 1 when closing the container fails after a success", async () => {
    const result = await run(["greet", "Ada"], {
      container: () => ({
        get: <T extends object>(type: abstract new (...args: never[]) => T) =>
          Reflect.construct(type, []) as T,
        close: async () => {
          throw new Error("Could not close the pool");
        },
      }),
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Could not close the pool");
  });

  it("refuses a registry with a duplicate name before any run", () => {
    class Twin extends Command({
      name: "greet",
      description: "Again",
    }) {
      handle() {
        return 0;
      }
    }
    expect(() =>
      createConsole({ name: "acme", version: "1", commands: [GreetCommand, Twin] }),
    ).toThrow(/greet/);
  });
});
