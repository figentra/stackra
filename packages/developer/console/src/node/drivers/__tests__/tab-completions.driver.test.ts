/**
 * Stackra file contract:
 * Purpose: proves the Tab driver writes a bash, zsh and fish script that calls back `<bin> complete --`, completes
 *          command names, spaced subcommands, options and choice values, leaves hidden commands out, and prints
 *          nothing itself; and that the kernel answers `completion <shell>` and `complete -- <words>` with them.
 * Boundary: unit test on the real `@bomb.sh/tab`.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-006, FR-016 and AC-008; ADR 0022 (test placement).
 */
// @covers sta-1966:FR-006 sta-1966:FR-016 sta-1966:AC-008
import { Command } from "#core/bases/command.base";
import { Option } from "#core/decorators/option.decorator";
import { buildRegistry } from "#core/functions/build-registry.function";
import { TabCompletionsDriver } from "#node/drivers/tab-completions.driver";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

const make = (name: string, hidden = false) =>
  class extends Command({
    name,
    description: `Run ${name}`,
    hidden,
  }) {
    handle() {
      return 0;
    }
  };

/** Creates an app from a template. */
class InitCommand extends Command({
  name: "init",
  description: "Create an app",
}) {
  @Option({
    description: "The template",
    choices: ["app", "service"],
  })
  template = "app";

  @Option({ description: "Install now" })
  install = true;

  handle() {
    return 0;
  }
}

const COMMANDS = [InitCommand, make("mcp:sync"), make("mcp:exec"), make("secret", true)];
const definitions = [...new Set(buildRegistry(COMMANDS).values())].map((entry) => entry.structure);
const tab = new TabCompletionsDriver();
const values = (words: string[]) =>
  tab.complete(words, definitions).map((candidate) => candidate.value);

describe("TabCompletionsDriver", () => {
  it.each(["bash", "zsh", "fish"] as const)(
    "writes a %s script that calls back `acme complete --`",
    (shell) => {
      const log = vi.spyOn(console, "log");
      const script = tab.script(shell, "acme", definitions);
      expect(script).toContain("acme complete --");
      expect(log).not.toHaveBeenCalled();
      log.mockRestore();
    },
  );

  it("completes commands, the built-ins and spaced subcommands, never hidden ones", () => {
    expect(values([""])).toEqual(expect.arrayContaining(["init", "mcp", "help", "completion"]));
    expect(values([""])).not.toContain("secret");
    expect(values(["mcp", ""]).toSorted()).toEqual(["exec", "sync"]);
  });

  it("completes options, the global ones and choice values", () => {
    expect(values(["init", "--te"])).toEqual(["--template"]);
    expect(values(["init", "--js"])).toEqual(["--json"]);
    expect(values(["init", "--template", ""]).toSorted()).toEqual(["app", "service"]);
    expect(values(["completion", ""]).toSorted()).toEqual(["bash", "fish", "zsh"]);
  });
});

describe("completion through the kernel", () => {
  it("prints the script for `completion <shell>` and refuses an unknown shell", async () => {
    const zsh = await runCommandForTest(COMMANDS, ["completion", "zsh"], { completions: tab });
    expect(zsh.exitCode).toBe(0);
    expect(zsh.stdout).toContain("app complete --");
    const tcsh = await runCommandForTest(COMMANDS, ["completion", "tcsh"], { completions: tab });
    expect(tcsh.exitCode).toBe(2);
    expect(tcsh.stderr).toContain("bash, zsh, fish");
  });

  it("answers `complete -- <words>` with one candidate per line and the directive", async () => {
    const result = await runCommandForTest(COMMANDS, ["complete", "--", "mcp", "s"], {
      completions: tab,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("sync\tRun mcp:sync\n:4\n");
  });

  it("refuses with a problem when no completions driver is bound", async () => {
    const result = await runCommandForTest(COMMANDS, ["completion", "bash"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Tab completion is not available here");
  });

  it("refuses a command named after a built-in", () => {
    expect(() => buildRegistry([make("completion")])).toThrow(/built in/);
    expect(() => buildRegistry([make("complete")])).toThrow(/built in/);
  });
});
