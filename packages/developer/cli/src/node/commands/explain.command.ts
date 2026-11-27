/**
 * Stackra file contract:
 * Purpose: `ExplainCommand`, `stackra explain <code>`: what a code gen, `stackra check` or Runway printed means: its
 *          tool and group, what usually causes it, the usual fix, the docs link to its place in the error-code
 *          reference, and the command that shows the finding again (`Rerun`). The entry is the `--json` data, and the local
 *          developer MCP serves the same command as its `explain` tool. A code in another case, or with `-` for `_`,
 *          still finds its entry, and so does a `stackra check` finding copied as printed, `<tool>/<rule>`.
 * Boundary: reads `ERROR_CODES` (`@stackra/gen`, copied from the reference page) only; never runs a tool. An unknown
 *           code is a usage error (exit 2) with up to five close codes as the hint and the reference as the docs link;
 *           left out at a terminal, the code is asked for.
 * Runtime: node
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decision 26: refusals print their fix); ADR 0282
 *                     (decision 5: the local MCP shares the CLI's commands); ADR 0506; STA-2853; STA-2891.
 */
import { Argument, Command, type CommandIo } from "@stackra/console";
import { ERROR_CODES, ERROR_CODES_PAGE, errorCodeDocs } from "@stackra/gen";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { closestCodes } from "#node/explain/functions/closest-codes.function";
import { findErrorCode } from "#node/explain/functions/find-error-code.function";

/** The command that shows a finding of each tool again, where one does. */
const SHOW_AGAIN: Readonly<Record<string, string>> = {
  gen: "stackra gen --check",
  check: "stackra check",
};

/** Explains an error code. */
export class ExplainCommand extends Command({
  name: "explain",
  description: "Explain an error code: what causes it, how to fix it, and where the docs say more",
  bin: true,
  tool: { readOnly: true },
  docs: ERROR_CODES_PAGE,
  examples: [
    "stackra explain shape_number_kind",
    "stackra explain repo-checks/imports",
    "stackra explain json-configs --json",
  ],
}) {
  /** The code to explain. */
  @Argument({
    description: "The code a tool printed, such as shape_number_kind or repo-checks/imports",
    prompt: "Which error code? (the word after error or warning)",
  })
  code!: string;

  /** Prints the entry, or refuses an unknown code with the closest ones. */
  handle(io: CommandIo): void {
    const entry = findErrorCode(this.code);
    if (entry === undefined) {
      const close = closestCodes(
        this.code,
        ERROR_CODES.map(({ code }) => code),
      );
      throw new CliUsageError(
        `unknown error code: ${this.code.trim()}`,
        close.length > 0
          ? `Did you mean ${close.join(", ")}?`
          : "Check the code against the line the tool printed; the Docs link lists every code",
      );
    }
    const docs = errorCodeDocs(entry.code);
    const again = SHOW_AGAIN[entry.tool];
    if (io.json) {
      io.output.json({
        code: entry.code,
        tool: entry.tool,
        group: entry.group,
        cause: entry.cause,
        fix: entry.fix,
        docs,
        ...(again === undefined ? {} : { rerun: again }),
      });
      return;
    }
    io.output.title(`${entry.code} · ${entry.tool} · ${entry.group}`);
    const rows: [string, string][] = [
      ["Cause", entry.cause],
      ["Fix", entry.fix],
      ["Docs", docs],
      ...(again === undefined ? [] : [["Rerun", again] as [string, string]]),
    ];
    // One labelled line each, like the error screen: a long cause wraps in the terminal instead of a dotted leader.
    for (const [label, value] of rows) io.output.line(`${label.padEnd(7)}${value}`);
    io.output.line();
    io.output.line(
      "The line the tool printed names your file and class; it is more specific than this entry.",
    );
  }
}
