/**
 * Stackra file contract:
 * Purpose: proves `parseInvocation` binds long, short, `=`, negated, repeated and `--` tokens (a boolean named
 *          `no-<x>` beside a string option `<x>` read as itself), converts numbers, and
 *          reports a missing argument, an unknown option, a bad number, a value out of bounds and a surplus token.
 * Boundary: unit test.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-009, FR-010 and FR-015; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-009 sta-1730:FR-010 sta-1730:FR-015
import { Int, List, Num, Str } from "@stackra/validation";

import { Command } from "#core/bases/command.base";
import { Argument } from "#core/decorators/argument.decorator";
import { Option } from "#core/decorators/option.decorator";
import { parseInvocation } from "#core/functions/parse-invocation.function";
import { readCommand } from "#core/functions/read-command.function";
import { splitInvocation } from "#core/functions/split-invocation.function";

class CopyCommand extends Command({
  name: "copy",
  description: "Copy",
}) {
  @Argument
  source!: string;

  @Argument
  @List
  targets?: string[];

  @Option({ short: "c" })
  @Int({
    min: 1,
    max: 9,
  })
  count = 1;

  @Option
  @Num
  ratio?: number;

  @Option
  force = true;

  @Option
  @List
  tag?: string[];

  handle() {
    return 0;
  }
}

const structure = readCommand(CopyCommand);

/** A string option beside a boolean whose own flag is its `no-` form (`stackra dev --infra` and `--no-infra`). */
class ServeCommand extends Command({
  name: "serve",
  description: "Serve",
}) {
  @Option
  @Str
  infra?: string;

  @Option
  noInfra = false;

  @Option
  quiet2 = true;

  handle() {
    return 0;
  }
}
const parse = (...tokens: string[]) => parseInvocation(tokens, structure);

describe("parseInvocation", () => {
  it("binds positionals in order, the last list taking the rest", () => {
    expect(parse("a", "b", "c").values).toEqual({ source: "a", targets: ["b", "c"] });
  });

  it("binds long, short and = forms, negation and repeats, converting numbers", () => {
    expect(
      parse("a", "-c", "3", "--ratio=0.5", "--no-force", "--tag", "x", "--tag", "y").values,
    ).toEqual({
      source: "a",
      count: 3,
      ratio: 0.5,
      force: false,
      tag: ["x", "y"],
    });
  });

  it("reads a boolean named no-<x> as itself beside a string option <x>, not as its negation", () => {
    const serve = readCommand(ServeCommand);
    expect(parseInvocation(["--no-infra"], serve).values).toEqual({ noInfra: true });
    expect(parseInvocation(["--infra", "mail,clam", "--no-infra"], serve).values).toEqual({
      infra: "mail,clam",
      noInfra: true,
    });
    expect(parseInvocation(["--infra=mail"], serve).values).toEqual({ infra: "mail" });
    // Any other flag still negates as before.
    expect(parseInvocation(["--no-quiet2"], serve).values).toEqual({ quiet2: false });
  });

  it("treats every token after -- as positional", () => {
    expect(parse("--", "--force").values).toEqual({ source: "--force" });
  });

  it("reads the global options", () => {
    expect(parseInvocation(["--json", "-v", "--no-interaction", "--no-ansi"]).globals).toEqual({
      help: false,
      version: false,
      verbose: true,
      quiet: false,
      interaction: false,
      json: true,
      ansi: false,
    });
  });

  it.each([
    [[], /argument <source> is missing/],
    [["a", "--nope"], /--nope/],
    [["a", "-c", "two"], /--count must be a whole number, got "two"/],
    [["a", "-c", "1.5"], /--count must be a whole number/],
    [["a", "-c", "12"], /--count must be at most 9, got 12/],
    [["a", "--ratio", ""], /--ratio must be a number/],
  ])("reports %j", (tokens, message) => {
    expect(parse(...tokens).error?.message).toMatch(message);
  });

  it("does not report a missing argument under --help", () => {
    expect(parse("--help").error).toBeUndefined();
  });

  it("reports a surplus positional of a command without list arguments", () => {
    class One extends Command({
      name: "one",
      description: "One",
    }) {
      @Argument
      only!: string;

      handle() {
        return 0;
      }
    }
    expect(parseInvocation(["a", "b"], readCommand(One)).error?.message).toMatch(
      /"b" has no place/,
    );
  });

  it("keeps --json readable when the rest fails", () => {
    expect(parse("a", "--nope", "--json").globals.json).toBe(true);
  });
});

describe("splitInvocation", () => {
  it("takes the first positional before -- as the name and spells -n out", () => {
    expect(splitInvocation(["-n", "copy", "a", "--", "b"])).toEqual({
      name: "copy",
      rest: ["--no-interaction", "a", "--", "b"],
      raw: ["-n", "a", "--", "b"],
    });
    expect(splitInvocation(["--", "copy"])).toEqual({
      name: undefined,
      rest: ["--", "copy"],
      raw: ["--", "copy"],
    });
  });
});
