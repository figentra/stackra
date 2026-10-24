/**
 * Stackra file contract:
 * Purpose: `findShortcutConflicts`, the conflict detector: every pair of shortcuts whose bindings are the same keys,
 *          or where one binding is the start of the other's chord, on Apple devices or elsewhere.
 * Boundary: pure; gen calls it over a member and its dependencies, `registerShortcuts` over what is registered. `mod`
 *           is resolved per platform first, so `mod+k` clashes with `meta+k` (Apple) and with `ctrl+k` (elsewhere).
 *           A pair is reported once, as `same` when it is the same keys on either platform.
 * Runtime: isomorphic
 * Governing contract: registry v3.1 final review H (gen conflict checks); ADR 0281 (decision 6: conflicts are checked).
 */
import { MODIFIERS } from "#core/constants/modifiers.constant";
import { ShortcutConflictKind } from "#core/enums/shortcut-conflict-kind.enum";
import { normalizeShortcutKeys } from "#core/functions/normalize-shortcut-keys.function";
import type { ShortcutConflict } from "#core/types/shortcut-conflict.type";

/** A normal-form step with `mod` replaced by what it is on the platform. */
function resolveStep(step: string, apple: boolean): string {
  const parts = step.split("+");
  const modifiers = parts
    .slice(0, -1)
    .map((modifier) => (modifier === "mod" ? (apple ? "meta" : "ctrl") : modifier));
  return [...MODIFIERS.filter((modifier) => modifiers.includes(modifier)), parts.at(-1)].join("+");
}

/** How two resolved step lists clash, if they do. */
function clash(
  first: readonly string[],
  second: readonly string[],
): ShortcutConflictKind | undefined {
  const shared = Math.min(first.length, second.length);
  for (let index = 0; index < shared; index++) if (first[index] !== second[index]) return undefined;
  return first.length === second.length ? ShortcutConflictKind.Same : ShortcutConflictKind.Prefix;
}

/**
 * Every clashing pair among `shortcuts`.
 *
 * @throws RangeError when a binding is not a key binding (see `normalizeShortcutKeys`).
 * @example
 * findShortcutConflicts([
 *   { key: "console.open_palette", keys: "mod+k" },
 *   { key: "console.search", keys: "meta+k" },
 * ]);
 * // [{ kind: "same", shortcuts: ["console.open_palette", "console.search"], keys: ["mod+k", "meta+k"] }]
 */
export function findShortcutConflicts(
  shortcuts: readonly { readonly key: string; readonly keys: string }[],
): ShortcutConflict[] {
  const read = shortcuts.map((shortcut) => ({
    key: shortcut.key,
    steps: normalizeShortcutKeys(shortcut.keys),
  }));
  const conflicts: ShortcutConflict[] = [];
  for (const [index, first] of read.entries())
    for (const second of read.slice(index + 1)) {
      const kinds = [true, false].map((apple) =>
        clash(
          first.steps.map((step) => resolveStep(step, apple)),
          second.steps.map((step) => resolveStep(step, apple)),
        ),
      );
      const kind = kinds.includes(ShortcutConflictKind.Same)
        ? ShortcutConflictKind.Same
        : kinds.find((found) => found !== undefined);
      if (kind !== undefined)
        conflicts.push({
          kind,
          shortcuts: [first.key, second.key],
          keys: [first.steps.join(" "), second.steps.join(" ")],
        });
    }
  return conflicts;
}
