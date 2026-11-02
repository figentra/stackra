/**
 * Stackra file contract:
 * Purpose: `buildRegistry(commands)`, the registry of one console: every command by its name and each alias, read
 *          once, with a name claimed twice, or a built-in's (`help`, `completion`, `complete`),
 *          refused.
 * Boundary: pure; the classes come from `createConsole({ commands })` or gen's `#stackra/commands`, never from a scan.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-006 and FR-007; STA-1966 spec FR-016.
 */
import { COMPLETE_COMMAND } from "#core/constants/complete-command.constant";
import { COMPLETION_COMMAND } from "#core/constants/completion-command.constant";
import { HELP_COMMAND } from "#core/constants/help-command.constant";
import { ConsoleDeclarationError } from "#core/errors/console-declaration.error";
import { DuplicateCommandError } from "#core/errors/duplicate-command.error";
import { readCommand } from "#core/functions/read-command.function";
import type { CommandClass } from "#core/types/command-class.type";
import type { CommandEntry } from "#core/types/command-entry.type";

/** The built-in commands no registered command may take the name of. */
const BUILT_IN = new Set([HELP_COMMAND, COMPLETION_COMMAND, COMPLETE_COMMAND]);

/**
 * The registry of `commands`, keyed by every name and alias.
 *
 * @throws DuplicateCommandError when two classes claim one name.
 * @throws ConsoleDeclarationError when a class is declared wrongly.
 */
export function buildRegistry(
  commands: readonly CommandClass[],
): ReadonlyMap<string, CommandEntry> {
  const registry = new Map<string, CommandEntry>();
  for (const type of new Set(commands)) {
    const structure = readCommand(type);
    const entry: CommandEntry = Object.freeze({ type, structure });
    for (const name of [structure.name, ...structure.aliases]) {
      if (BUILT_IN.has(name)) throw new ConsoleDeclarationError(type.name, `"${name}" is built in`);
      const holder = registry.get(name);
      if (holder !== undefined) throw new DuplicateCommandError(name, holder.type.name, type.name);
      registry.set(name, entry);
    }
  }
  return registry;
}
