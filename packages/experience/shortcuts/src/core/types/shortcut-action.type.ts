/**
 * Stackra file contract:
 * Purpose: `ShortcutAction`, one UI action defined once (`{ id, label, icon, shortcut, run, when, permission }`) that
 *          feeds the button, the menu item, the palette entry, the tooltip and the cheat sheet.
 * Boundary: a type only. It is a client-side descriptor, not the server `Action` kind of @stackra/actions: `run` may
 *           call one, `permission` names the permission the host's `can` checks, and `id` is what remaps key on.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (one action definition).
 */
import type { IconName } from "@stackra/icons/contracts";

import type { ShortcutScope } from "#core/enums/shortcut-scope.enum";

/** One action and its shortcut. */
export interface ShortcutAction {
  /** Stable id (`orders.create`); remaps and the cheat sheet key on it. */
  readonly id: string;
  /** The words of the action, already translated. */
  readonly label: string;
  /** The binding (`mod+s`, `g o`); absent for an action with no key. */
  readonly shortcut?: string | undefined;
  /** What the action does. */
  readonly run: () => void;
  /** The cheat sheet's group words; defaults to the scope's. */
  readonly group?: string | undefined;
  /** The icon a palette or a button shows. */
  readonly icon?: IconName | undefined;
  /** Where it listens; `page` by default, `overlay` inside an overlay's scope. */
  readonly scope?: ShortcutScope | undefined;
  /** Checked at key time: false skips the press, so the key falls through to the browser. */
  readonly when?: (() => boolean) | undefined;
  /** A permission the host's `can` must grant, or the action is not registered. */
  readonly permission?: string | undefined;
  /** True: not registered (a disabled action's key does nothing and is not listed). */
  readonly isDisabled?: boolean | undefined;
  /** True: the binding is written left to right and mirrors (Left and Right swap) when the page is right to left. */
  readonly isDirectional?: boolean | undefined;
}
