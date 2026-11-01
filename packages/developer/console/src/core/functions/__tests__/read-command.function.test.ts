/**
 * Stackra file contract:
 * Purpose: proves `readCommand` reads arguments and options in field order with their value kinds, defaults and
 *          bounds, and refuses each wrong declaration with a `ConsoleDeclarationError` naming the field.
 * Boundary: unit test; the fixture commands are declared here.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-002 to FR-005; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-002 sta-1730:FR-003 sta-1730:FR-004 sta-1730:FR-005
import { Int, List, Num, Str } from "@stackra/validation";

import { Command } from "#core/bases/command.base";
import { Argument } from "#core/decorators/argument.decorator";
import { Option } from "#core/decorators/option.decorator";
import { ConsoleDeclarationError } from "#core/errors/console-declaration.error";
import { readCommand } from "#core/functions/read-command.function";

class SeedCommand extends Command({
  name: "account:seed",
  description: "Seed an account",
}) {
  @Argument({ description: "The account" })
  account!: string;

  @Argument
  @Int({ min: 1 })
  rounds = 1;

  @Option({ short: "c" })
  @Int({
    min: 1,
    max: 100,
  })
  count = 10;

  @Option
  @Num
  ratio?: number;

  @Option
  dryRun = false;

  @Option
  @List
  only?: string[];

  @Option
  @Str({ min: 2 })
  label?: string;

  handle() {
    return 0;
  }
}

describe("readCommand", () => {
  const structure = readCommand(SeedCommand);

  it("reads the arguments in field order, required unless they have an initialiser", () => {
    expect(
      structure.arguments.map(({ property, kind, required }) => ({ property, kind, required })),
    ).toEqual([
      { property: "account", kind: "string", required: true },
      { property: "rounds", kind: "integer", required: false },
    ]);
    expect(structure.arguments[0]?.description).toBe("The account");
  });

  it("reads the options with kebab flags, kinds, shorts, defaults and bounds", () => {
    expect(structure.options.map(({ flag, kind, list }) => ({ flag, kind, list }))).toEqual([
      { flag: "count", kind: "integer", list: false },
      { flag: "ratio", kind: "number", list: false },
      { flag: "dry-run", kind: "boolean", list: false },
      { flag: "only", kind: "string", list: true },
      { flag: "label", kind: "string", list: false },
    ]);
    expect(structure.options[0]).toMatchObject({ short: "c", default: 10, min: 1, max: 100 });
    expect(structure.options[2]?.default).toBe(false);
    expect(structure.options[4]?.min).toBe(2);
  });

  it("is read once per class", () => {
    expect(readCommand(SeedCommand)).toBe(structure);
  });

  it("refuses a class that is not a command", () => {
    class Plain {}
    expect(() => readCommand(Plain as never)).toThrow(ConsoleDeclarationError);
  });

  it("refuses a required argument after an optional one", () => {
    class Wrong extends Command({
      name: "wrong",
      description: "x",
    }) {
      @Argument({ optional: true })
      first?: string;

      @Argument
      second!: string;

      handle() {
        return 0;
      }
    }
    expect(() => readCommand(Wrong)).toThrow(/required argument second follows the optional first/);
  });

  it("refuses an argument after a list argument", () => {
    class Wrong extends Command({
      name: "wrong",
      description: "x",
    }) {
      @Argument
      @List
      files?: string[];

      @Argument({ optional: true })
      last?: string;

      handle() {
        return 0;
      }
    }
    expect(() => readCommand(Wrong)).toThrow(/last follows the list argument files/);
  });

  it("refuses two fields with one short letter", () => {
    class Wrong extends Command({
      name: "wrong",
      description: "x",
    }) {
      @Option({ short: "a" })
      alpha = false;

      @Option({ short: "a" })
      also = false;

      handle() {
        return 0;
      }
    }
    expect(() => readCommand(Wrong)).toThrow(/also and alpha both use "-a"/);
  });

  it.each([
    [
      "the long name of a global option",
      "verbose",
      undefined,
      /--verbose \(verbose\) is a global option/,
    ],
    ["the letter of a global option", "loud", "q", /-q \(loud\) is a global option/],
    ["-n, the letter of --no-interaction", "name", "n", /-n \(name\) is a global option/],
    ["a short that is not one letter", "force", "ff", /must be one letter/],
  ])("refuses %s", (_, property, short, message) => {
    class Wrong extends Command({
      name: "wrong",
      description: "x",
    }) {
      handle() {
        return 0;
      }
    }
    Option(short === undefined ? {} : { short })(Wrong.prototype, property);
    expect(() => readCommand(Wrong)).toThrow(message);
  });

  it("refuses a field that is both an argument and an option", () => {
    class Wrong extends Command({
      name: "wrong",
      description: "x",
    }) {
      @Argument
      @Option
      both?: string;

      handle() {
        return 0;
      }
    }
    expect(() => readCommand(Wrong)).toThrow(/both is both an @Argument and an @Option/);
  });
});
