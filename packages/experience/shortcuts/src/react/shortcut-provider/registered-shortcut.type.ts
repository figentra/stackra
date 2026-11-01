/**
 * Stackra file contract:
 * Purpose: `RegisteredShortcut`, one action the provider listens for, as the cheat sheet, the palette and the
 *          settings panel list it: its id, words, group, scope, icon and the binding in force.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (the cheat sheet and the palette read the registry).
 */
import type { IconName } from "@stackra/icons/contracts";

import type { ShortcutScope } from "#core/enums/shortcut-scope.enum";

/** One registered action. */
export interface RegisteredShortcut {
  /** The action's stable id, which remaps key on. */
  readonly id: string;
  /** The words that name the action in lists. */
  readonly label: string;
  /** The cheat sheet group the action is listed under. */
  readonly group?: string | undefined;
  /** Where the action's key listens. */
  readonly scope: ShortcutScope;
  /** The icon a palette shows beside the action. */
  readonly icon?: IconName | undefined;
  /** The binding the action declares, before remaps. */
  readonly defaultKeys?: string | undefined;
  /** The binding in force, in normal form; absent when unbound. */
  readonly keys?: string | undefined;
}
