/**
 * Stackra file contract:
 * Purpose: `registerShortcuts`, which links each shortcut class to its derived key and label (`[OpenPaletteShortcut,
 *          "console.open_palette", "shortcuts::open_palette.label"]`): the call the generated wiring makes for every
 *          shortcut of a member, from the identities locked in `stackra.manifest.json`.
 * Boundary: writes `SHORTCUT_ENTRIES`, all or nothing: the batch is checked against what is already registered, and a
 *           bad key or label, a class that is not a shortcut, a key taken by another class or a binding conflict
 *           throws and registers none of it. Registering a class again replaces its entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); registry v3.1 gen-core needs (item 4) and final review H
 *                     (conflict checks).
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";
import type { IconName } from "@stackra/icons/contracts";

import type { RunnableShortcut } from "#core/types/runnable-shortcut.type";
import { SHORTCUT_ENTRIES } from "#core/constants/shortcut-entries.constant";
import { findShortcutConflicts } from "#core/functions/find-shortcut-conflicts.function";
import type { ShortcutEntry } from "#core/types/shortcut-entry.type";

/** `<member>.<name>`, each segment snake_case. */
const SHORTCUT_KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;

/** `<namespace>::<path>`, the namespace snake_case and the path dotted snake_case. */
const LABEL_KEY = /^[a-z][a-z0-9_]*::[a-z0-9_]+(?:\.[a-z0-9_]+)*$/;

/** The entry of `type`, read from the options its `Shortcut({...})` call recorded. */
function entryOf(type: AnyClass<RunnableShortcut>, key: string, label: string): ShortcutEntry {
  const record = kindOf(type);
  if (record?.kind !== "shortcut")
    throw new TypeError(`${type.name} does not extend Shortcut({...})`);
  if (typeof (type.prototype as Partial<RunnableShortcut>).run !== "function")
    throw new TypeError(`${type.name} has no run(ctx) method`);
  const keys = (record.options["keys"] as string | null | undefined) ?? null;
  return {
    type,
    key,
    label,
    group: record.options["group"] as string,
    keys,
    steps: keys === null ? [] : keys.split(" "),
    icon: (record.options["icon"] as IconName | null | undefined) ?? null,
    intents: (record.options["intents"] as readonly string[] | undefined) ?? [],
  };
}

/**
 * Registers the key and label of each shortcut class.
 *
 * @throws RangeError when a key is not `<member>.<name>` or a label not `<namespace>::<path>` in snake_case, when a
 *         key is already another class's, or when two bindings conflict (`findShortcutConflicts`).
 * @throws TypeError when a class does not extend `Shortcut({...})` or has no `run` method.
 * @example
 * registerShortcuts([
 *   [OpenPaletteShortcut, "console.open_palette", "shortcuts::open_palette.label"],
 *   [ToggleSidebarShortcut, "console.toggle_sidebar", "shortcuts::toggle_sidebar.label"],
 * ]);
 */
export function registerShortcuts(
  entries: readonly (readonly [type: AnyClass<RunnableShortcut>, key: string, label: string])[],
): void {
  const next = new Map(SHORTCUT_ENTRIES);
  for (const [type, key, label] of entries) {
    if (!SHORTCUT_KEY.test(key))
      throw new RangeError(`Shortcut key "${key}" is not <member>.<name> in snake_case`);
    if (!LABEL_KEY.test(label))
      throw new RangeError(`Shortcut label "${label}" is not <namespace>::<path> in snake_case`);
    for (const entry of next.values())
      if (entry.key === key && entry.type !== type)
        throw new RangeError(`Shortcut key "${key}" is already ${entry.type.name}'s`);
    next.set(type, entryOf(type, key, label));
  }
  const bound = [...next.values()].flatMap((entry) =>
    entry.keys === null ? [] : [{ key: entry.key, keys: entry.keys }],
  );
  const conflicts = findShortcutConflicts(bound);
  if (conflicts.length > 0)
    throw new RangeError(
      `Shortcut bindings conflict: ${conflicts
        .map(
          ({ kind, shortcuts, keys }) =>
            `${shortcuts[0]} (${keys[0]}) and ${shortcuts[1]} (${keys[1]}) are ${kind}`,
        )
        .join("; ")}`,
    );
  SHORTCUT_ENTRIES.clear();
  for (const [type, entry] of next) SHORTCUT_ENTRIES.set(type, entry);
}
