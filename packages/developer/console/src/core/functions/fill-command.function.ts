/**
 * Stackra file contract:
 * Purpose: `fillCommand(command, entry, values)`, puts the parsed values on a built command: each value of a shared
 *          option set (`@Options`) on the set instance in its field (built from the set class when the field has no
 *          initialiser), every other value on the command itself.
 * Boundary: mutates `command` and the set instances it holds; never reads the command line.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-006; STA-2924 spec FR-002.
 */
import type { Command } from "#core/bases/command.base";
import { Options } from "#core/decorators/options.decorator";
import type { CommandEntry } from "#core/types/command-entry.type";

/**
 * Fills `command` with `values`, by field.
 *
 * @example
 * fillCommand(command, entry, { fix: true, verbose: false });
 */
export function fillCommand(
  command: Command,
  entry: CommandEntry,
  values: Readonly<Record<string, unknown>>,
): void {
  const fields = command as unknown as Record<string, unknown>;
  const sets = Options.members(entry.type);
  const shared = new Map(
    entry.structure.options
      .filter((field) => field.set !== undefined)
      .map((field) => [field.property, field.set as string]),
  );
  // Every set field holds its instance, so `handle` reads the defaults even when no shared flag was given.
  for (const [key, OptionSetType] of sets) fields[String(key)] ??= new OptionSetType();
  for (const [property, value] of Object.entries(values)) {
    const set = shared.get(property);
    if (set === undefined) fields[property] = value;
    else (fields[set] as Record<string, unknown>)[property] = value;
  }
}
