/**
 * Stackra file contract:
 * Purpose: `Shortcut`, the kind base of a shortcut: `class ToggleSidebarShortcut extends Shortcut({ keys: "mod+b",
 *          group }) { run() { ... } }` in an app's `shortcuts/` group, one `<name>.shortcut.ts` per shortcut. A
 *          shortcut is the one owner of its key and its behaviour: the keyboard, the palette and the desktop menus all
 *          run the class. The interface of the same name is its instance side.
 * Boundary: called only (`group` is required). The call checks the key binding and records the options in the kind
 *           registry, with `keys` in its normal form (`shift+mod+L` is recorded `mod+shift+l`) and the defaults
 *           filled in; `registerShortcuts`, the palette, the key hints and gen read them through `kindOf`. The key and
 *           the label are derived, so neither is an option. Dependencies arrive through the constructor.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 17, 23 and 25); ADR 0305 (rules 2 and 3); registry v3.1 (Shortcut row,
 *                     kind-base ownership).
 */
import { createKind } from "@stackra/container";

import { normalizeShortcutKeys } from "#core/functions/normalize-shortcut-keys.function";
import type { ShortcutClass } from "#core/types/shortcut-class.type";
import type { ShortcutOptions } from "#core/types/shortcut-options.type";

/**
 * The instance side of every shortcut class. `run(ctx)` is the author's, not the base's: declared here it would make
 * every author write `override run` (noImplicitOverride), so the runners take a `RunnableShortcut` instead.
 */
export interface Shortcut {
  /** Type-only kind brand, so a class of another kind cannot stand in for a shortcut. */
  readonly "~kind": "shortcut";
}

/**
 * Checks `options` and fills in the defaults.
 *
 * @throws RangeError when `group` is empty or `keys` is not a key binding.
 */
function readShortcutOptions(options: ShortcutOptions): Readonly<Record<string, unknown>> {
  if (options.group.trim() === "") throw new RangeError("A shortcut needs a palette group");
  return {
    keys: options.keys === undefined ? null : normalizeShortcutKeys(options.keys).join(" "),
    group: options.group,
    icon: options.icon ?? null,
    intents: Object.freeze([...(options.intents ?? [])]),
  };
}

/**
 * The shortcut kind base.
 *
 * @example
 * export class OpenPaletteShortcut extends Shortcut({
 *   keys: "mod+k",
 *   group: I18n.console.palette.group_app,
 * }) {
 *   constructor(private readonly palette: PaletteStore) {
 *     super();
 *   }
 *
 *   run(): void {
 *     this.palette.open();
 *   }
 * }
 */
export const Shortcut = createKind(
  "shortcut",
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: createKind needs a class; a shortcut's base holds nothing
  class ShortcutBase {},
  readShortcutOptions,
) as (options: ShortcutOptions) => ShortcutClass;
