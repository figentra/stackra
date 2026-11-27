/**
 * Stackra file contract:
 * Purpose: `CheckOptionSet`, the eight flags `stackra check` and its presets (`validate`, `verify`, `code:check`,
 *          `code:fix`) share, declared once: each command takes them with `@Options(CheckOptionSet)`.
 * Boundary: fields only; `checkValues` hands them to the check body by its option names.
 * Runtime: node
 * Governing contract: ADR 0506; ADR 0500 (decision 7); STA-2883; STA-2924 (shared option sets).
 */
import { Option, OptionSet } from "@stackra/console";
import { Str } from "@stackra/validation";

/** The flags of every check command. */
export class CheckOptionSet extends OptionSet {
  /** Apply the fixes the tools can make. */
  @Option({
    description: "Apply the fixes the tools can make (format, lint), then report what is left",
  })
  fix = false;

  /** Only changed files. */
  @Option({ description: "Check only the files changed since --base" })
  affected = false;

  /** The phases to run. */
  @Option({ description: "Run only these phases, comma-separated (see `stackra check --help`)" })
  @Str
  only?: string;

  /** The phases to leave out. */
  @Option({ description: "Leave these phases out, comma-separated" })
  @Str
  skip?: string;

  /** How the findings print. */
  @Option({
    description: "text (default), json (the findings alone) or github (annotations)",
    choices: ["text", "json", "github"],
  })
  @Str
  format?: string;

  /** The base of --affected. */
  @Option({ description: "The ref --affected compares with (default: origin/main)" })
  @Str
  base?: string;

  /** Run the tests too. */
  @Option({ description: "Run the test phase too" })
  withTests = false;

  /** Keep going after a failed phase. */
  @Option({ description: "Run every phase even after one fails" })
  keepGoing = false;
}
