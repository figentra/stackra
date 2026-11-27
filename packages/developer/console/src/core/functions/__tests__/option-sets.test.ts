/**
 * Stackra file contract:
 * Purpose: proves the shared option sets of `@Options(SomeOptionSet)`: two commands taking one set keep their own
 *          names, each one's help lists every shared flag once beside its own, a run fills the set instance (defaults
 *          included) and the command's own fields, and a flag the set shares with the command, or a set field that is
 *          also an option, is a declaration error.
 * Boundary: unit test in-process; no terminal.
 * Runtime: node
 * Governing contract: STA-2924 spec FR-001 to FR-003; ADR 0022 (test placement).
 */
// @covers sta-2924:FR-001 sta-2924:FR-002 sta-2924:FR-003
import { Str } from "@stackra/validation";

import { Command } from "#core/bases/command.base";
import { OptionSet } from "#core/bases/option-set.base";
import { Option } from "#core/decorators/option.decorator";
import { Options } from "#core/decorators/options.decorator";
import { ConsoleDeclarationError } from "#core/errors/console-declaration.error";
import { readCommand } from "#core/functions/read-command.function";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

/** The flags both commands share. */
class GateOptionSet extends OptionSet {
  @Option({ description: "Apply the fixes" })
  fix = false;

  @Option({ description: "Only these phases" })
  @Str
  only?: string;
}

/** A command with the shared set and an option of its own. */
class LintCommand extends Command({
  name: "lint",
  description: "Lint",
}) {
  @Options(GateOptionSet)
  flags = new GateOptionSet();

  @Option({ description: "Stop at the first finding" })
  bail = false;

  handle() {
    return { fix: this.flags.fix, only: this.flags.only ?? null, bail: this.bail };
  }
}

/** A second command with the same set and no initialiser on its field. */
class FormatCommand extends Command({
  name: "format",
  description: "Format",
}) {
  @Options(GateOptionSet)
  flags!: GateOptionSet;

  handle() {
    return { fix: this.flags.fix, only: this.flags.only ?? null };
  }
}

const COMMANDS = [LintCommand, FormatCommand];

/** The `--json` data of a run. */
const data = async (argv: string[]) => {
  const result = await runCommandForTest(COMMANDS, [...argv, "--json"]);
  expect(result.exitCode, result.stderr).toBe(0);
  return (JSON.parse(result.stdout) as { data: unknown }).data;
};

describe("@Options", () => {
  it("keeps each command's own name and lists both", async () => {
    expect(readCommand(LintCommand).name).toBe("lint");
    expect(readCommand(FormatCommand).name).toBe("format");
    const listed = (await data(["list"])) as { name: string }[];
    expect(listed.map((row) => row.name)).toEqual(expect.arrayContaining(["lint", "format"]));
  });

  it("adds the shared flags to each command once, marked with their set", () => {
    const options = readCommand(LintCommand).options;
    expect(options.map((field) => field.flag)).toEqual(["bail", "fix", "only"]);
    expect(options.find((field) => field.flag === "fix")).toMatchObject({
      property: "fix",
      kind: "boolean",
      default: false,
      set: "flags",
    });
    expect(options.find((field) => field.flag === "only")).toMatchObject({
      kind: "string",
      set: "flags",
    });
    expect(options.find((field) => field.flag === "bail")?.set).toBeUndefined();
  });

  it("lists every shared flag exactly once in the help", async () => {
    for (const name of ["lint", "format"]) {
      const result = await runCommandForTest(COMMANDS, [name, "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.match(/--fix\b/g), name).toHaveLength(1);
      expect(result.stdout.match(/--only\b/g), name).toHaveLength(1);
      expect(result.stdout).toContain("Apply the fixes");
    }
  });

  it("fills the set instance and the command's own fields from the line", async () => {
    expect(await data(["lint", "--fix", "--only", "lint,format", "--bail"])).toEqual({
      fix: true,
      only: "lint,format",
      bail: true,
    });
    expect(await data(["format", "--only=docs"])).toEqual({ fix: false, only: "docs" });
  });

  it("gives the set its defaults when no shared flag is given, with or without an initialiser", async () => {
    expect(await data(["lint"])).toEqual({ fix: false, only: null, bail: false });
    expect(await data(["format"])).toEqual({ fix: false, only: null });
  });

  it("refuses a command flag that clashes with a shared flag of the same name", () => {
    class ClashCommand extends Command({
      name: "clash",
      description: "Clash",
    }) {
      @Options(GateOptionSet)
      flags = new GateOptionSet();

      @Option({ description: "A fix of its own" })
      fix = false;

      handle() {
        return 0;
      }
    }
    expect(() => readCommand(ClashCommand)).toThrow(ConsoleDeclarationError);
    expect(() => readCommand(ClashCommand)).toThrow(/flags\.fix and fix both use "fix"/);
  });

  it("refuses two sets that share a flag", () => {
    class OtherOptionSet extends OptionSet {
      @Option({ description: "Another fix" })
      fix = false;
    }
    class TwiceCommand extends Command({
      name: "twice",
      description: "Twice",
    }) {
      @Options(GateOptionSet)
      gate = new GateOptionSet();

      @Options(OtherOptionSet)
      other = new OtherOptionSet();

      handle() {
        return 0;
      }
    }
    expect(() => readCommand(TwiceCommand)).toThrow(/other\.fix and gate\.fix both use "fix"/);
  });

  it("refuses a set field that is also an option", () => {
    class BothCommand extends Command({
      name: "both",
      description: "Both",
    }) {
      @Options(GateOptionSet)
      @Option({ description: "Not a flag" })
      flags = new GateOptionSet();

      handle() {
        return 0;
      }
    }
    expect(() => readCommand(BothCommand)).toThrow(/flags holds an @Options set/);
  });

  it("never reads an option set as a command", () => {
    expect(() => readCommand(GateOptionSet as never)).toThrow(ConsoleDeclarationError);
  });
});
