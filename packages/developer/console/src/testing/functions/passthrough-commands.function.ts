/**
 * Stackra file contract:
 * Purpose: `passthroughCommands(commands)`, the names of the commands still in the migration state (`passthrough:
 *          true`), sorted, so a CLI's test pins the list and the count only goes down until it is empty.
 * Boundary: reads definitions only; never builds a command.
 * Runtime: isomorphic
 * Governing contract: STA-1966 (leader 2026-11-02: passthrough is a migration state, not an end state).
 */
import { readCommand } from "#core/functions/read-command.function";
import type { CommandClass } from "#core/types/command-class.type";

/**
 * The commands of `commands` still in passthrough.
 *
 * @example
 * // packages/cli/src/__tests__/commands.test.ts — shrink this list as each command gets its fields.
 * expect(passthroughCommands(COMMANDS)).toEqual(["gate", "trace"]);
 */
export function passthroughCommands(commands: readonly CommandClass[]): string[] {
  return commands
    .map((type) => readCommand(type))
    .filter((structure) => structure.passthrough)
    .map((structure) => structure.name)
    .toSorted();
}
