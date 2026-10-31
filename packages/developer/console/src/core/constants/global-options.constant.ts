/**
 * Stackra file contract:
 * Purpose: `GLOBAL_OPTIONS`, the options every command takes (help, version, verbose, quiet, no-interaction, json,
 *          ansi), in the `node:util.parseArgs` shape, with the descriptions the help prints.
 * Boundary: data only; a command field that reuses one of these names or letters is refused (FR-005).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-015.
 */

/** One global option. */
interface GlobalOption {
  /** Always a flag. */
  readonly type: "boolean";
  /** Its letter. */
  readonly short?: string;
  /** What the help says. */
  readonly description: string;
}

/** The global options by long name. `interaction` is written `--no-interaction` or `-n`. */
export const GLOBAL_OPTIONS: Readonly<Record<string, GlobalOption>> = Object.freeze({
  help: { type: "boolean", short: "h", description: "Show the help of the command" },
  version: { type: "boolean", short: "V", description: "Show the version" },
  verbose: { type: "boolean", short: "v", description: "Show the stack and causes of an error" },
  quiet: { type: "boolean", short: "q", description: "Write errors only" },
  interaction: {
    type: "boolean",
    description: "Ask no question; use the defaults (-n, --no-interaction)",
  },
  json: { type: "boolean", description: "Write one JSON document" },
  ansi: { type: "boolean", description: "Force (or with --no-ansi, turn off) colour" },
});
