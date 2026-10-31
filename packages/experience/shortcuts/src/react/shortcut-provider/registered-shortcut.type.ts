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
  readonly id: string;
  readonly label: string;
  readonly group?: string | undefined;
  readonly scope: ShortcutScope;
  readonly icon?: IconName | undefined;
  /** The binding the action declares, before remaps. */
  readonly defaultKeys?: string | undefined;
  /** The binding in force, in normal form; absent when unbound. */
  readonly keys?: string | undefined;
}
