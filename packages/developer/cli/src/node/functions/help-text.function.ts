/**
 * Stackra file contract:
 * Purpose: `helpText(commands)`, what `stackra`, `stackra --help` and `stackra help` print: the synopsis and one
 *          aligned line per command.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0083.
 */
import type { CliCommand } from "#node/types/cli-command.type";

/**
 * The top-level help.
 *
 * @param commands - the commands to list, in order.
 * @example
 * helpText(COMMANDS);
 * // "Usage: stackra <command> [options]\n\nCommands:\n  gen          Generate …"
 */
export function helpText(commands: readonly CliCommand[]): string {
  const width = Math.max(...commands.map((command) => command.name.length));
  const rows = commands.map((command) => `  ${command.name.padEnd(width)}  ${command.summary}`);
  return [
    "Usage: stackra <command> [options]",
    "",
    "Commands:",
    ...rows,
    "",
    "Run `stackra <command> --help` for a command's options; `stackra --version` for the version.",
    "",
  ].join("\n");
}
