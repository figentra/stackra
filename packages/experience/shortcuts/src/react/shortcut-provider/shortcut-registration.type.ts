/**
 * Stackra file contract:
 * Purpose: `ShortcutRegistration`, one registered action: its latest definition, its scope, its overlay and, for the focus scope, its element.
 * Boundary: a type only; internal to `./react`.
 * Runtime: isomorphic
 * Governing contract: ADR 0508.
 */
import type { ShortcutScope } from "#core/enums/shortcut-scope.enum";
import type { ShortcutAction } from "#core/types/shortcut-action.type";

/** One action registered with the registry. */
export interface ShortcutRegistration {
  /** The latest definition (its `run` and `when` change every render). */
  readonly action: () => ShortcutAction | undefined;
  /** Where the action's key listens. */
  readonly scope: ShortcutScope;
  /** The overlay it belongs to, for the `overlay` scope. */
  readonly overlay: number | null;
  /** The element focus must be inside, for the `focus` scope. */
  readonly within?: { readonly current: Element | null } | undefined;
}
