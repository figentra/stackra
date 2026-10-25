/**
 * Stackra file contract:
 * Purpose: `ShortcutConflict`, one pair of shortcuts whose key bindings clash, as `findShortcutConflicts` reports it.
 * Boundary: a type only; gen turns each one into a build error, `registerShortcuts` into a thrown `RangeError`.
 * Runtime: isomorphic
 * Governing contract: registry v3.1 final review H (gen conflict checks); the template's shortcuts README ("Gen fails
 *                     on two shortcuts with the same key").
 */
import type { ShortcutConflictKind } from "#core/enums/shortcut-conflict-kind.enum";

/** Two shortcuts that cannot both keep their bindings. */
export interface ShortcutConflict {
  /** Why they clash. */
  readonly kind: ShortcutConflictKind;

  /** The keys of the two shortcuts (`console.open_palette`), in the order they were given. */
  readonly shortcuts: readonly [string, string];

  /** Their bindings in normal form, in the same order; for `prefix`, the shorter one may come first or second. */
  readonly keys: readonly [string, string];
}
