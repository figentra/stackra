/**
 * Stackra file contract:
 * Purpose: `topLevelMemberCommands(argv, cwd, builtins)`, the member console commands `stackra` adds beside its own
 *          for this run: none when the line names one of its own commands (the manifests are not read on that hot
 *          path), else every member command around `cwd` that takes no name, alias or kernel word of `builtins`, so
 *          the list, help, completion and "did you mean" see them as well as the run.
 * Boundary: reads manifests only through `readMemberCommands`; a member command whose name or alias the console
 *           refuses (not `[a-z0-9-]` segments joined by `:`) is left out, never an error for the whole CLI.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6); STA-2888.
 */
import { readCommand, type CommandClass } from "@stackra/console";

import { memberCommand } from "#node/functions/member-command.function";
import { readMemberCommands } from "#node/functions/read-member-commands.function";

/** The kernel's own words: they never name a member command, and help and completion must see member commands. */
const KERNEL_WORDS: ReadonlySet<string> = new Set(["help", "completion", "complete"]);

/**
 * The member commands to add to this run.
 *
 * @param argv - the command line without the program name.
 * @param cwd - the working directory; the workspace around it is read.
 * @param builtins - the `stackra` command classes, which always win a name.
 * @example
 * topLevelMemberCommands(["db:status", "--json"], "/repo", builtins); // [<db:status of services/orders>]
 * topLevelMemberCommands(["gen"], "/repo", builtins); // [] (a stackra command: nothing read)
 */
export function topLevelMemberCommands(
  argv: readonly string[],
  cwd: string,
  builtins: readonly CommandClass[],
): readonly CommandClass[] {
  const reserved = new Set(KERNEL_WORDS);
  for (const type of builtins) {
    const { name, aliases } = readCommand(type);
    for (const each of [name, ...aliases]) reserved.add(each);
  }
  const head = argv.includes("--") ? argv.slice(0, argv.indexOf("--")) : argv;
  const named = head.find((token) => !token.startsWith("-"));
  if (named !== undefined && reserved.has(named) && !KERNEL_WORDS.has(named)) return [];
  return readMemberCommands(cwd, reserved).flatMap((command) => {
    try {
      // The console checks a declaration when it reads it; a member's odd name must not take the CLI down.
      const type = memberCommand(command);
      readCommand(type);
      return [type];
    } catch {
      return [];
    }
  });
}
