/**
 * Stackra file contract:
 * Purpose: `findCommand(typed, registry)`, the command an Operator meant: an exact name or alias, else the one name
 *          whose every `:` segment starts with the typed segment (`t:s` for `tenant:seed`, as Symfony does).
 * Boundary: pure; an unknown or ambiguous name is a `UsageError` with suggestions.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-011.
 */
import { UsageError } from "#core/errors/usage.error";
import { suggestNames } from "#core/functions/suggest-names.function";
import type { CommandEntry } from "#core/types/command-entry.type";

/**
 * The entry `typed` names.
 *
 * @throws UsageError when no command, or more than one, matches.
 */
export function findCommand(
  typed: string,
  registry: ReadonlyMap<string, CommandEntry>,
): CommandEntry {
  const exact = registry.get(typed);
  if (exact !== undefined) return exact;
  const parts = typed.split(":");
  const matches = new Set<CommandEntry>();
  for (const [name, entry] of registry) {
    const segments = name.split(":");
    if (
      segments.length === parts.length &&
      segments.every((segment, i) => segment.startsWith(parts[i] ?? ""))
    )
      matches.add(entry);
  }
  const [only, ...others] = matches;
  if (only !== undefined && others.length === 0) return only;
  if (only !== undefined)
    throw new UsageError(
      `The command "${typed}" is ambiguous`,
      `Did you mean ${[...matches].map((entry) => entry.structure.name).join(", ")}?`,
    );
  const suggestions = suggestNames(typed, registry.keys());
  throw new UsageError(
    `The command "${typed}" does not exist`,
    suggestions.length === 0
      ? "Run with no command to list them"
      : `Did you mean ${suggestions.join(", ")}?`,
  );
}
