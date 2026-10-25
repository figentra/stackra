/**
 * Stackra file contract:
 * Purpose: `findCommand(commands, args)`, which command a command line names: the longest command name made of the
 *          leading words (`mcp sync` before `mcp`), and the arguments left after it.
 * Boundary: pure; an option ends the name, so `stackra mcp --help` names `mcp`.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: `agents setup|sync|check`, `db diff`, two-word commands).
 */
import type { CliCommand } from "#node/types/cli-command.type";

/**
 * The command `args` names and the arguments after its name, or `undefined` when it names none.
 *
 * @param commands - the commands to choose from.
 * @param args - the command line without the program name.
 * @example
 * findCommand(COMMANDS, ["mcp", "sync"]); // { command: MCP_SYNC_COMMAND, rest: [] }
 */
export function findCommand(
  commands: readonly CliCommand[],
  args: readonly string[],
): { readonly command: CliCommand; readonly rest: readonly string[] } | undefined {
  let found: { command: CliCommand; rest: readonly string[] } | undefined;
  for (const command of commands) {
    const words = command.name.split(" ");
    if (words.length <= (found?.command.name.split(" ").length ?? 0)) continue;
    if (words.every((word, index) => args[index] === word)) {
      found = { command, rest: args.slice(words.length) };
    }
  }
  return found;
}
