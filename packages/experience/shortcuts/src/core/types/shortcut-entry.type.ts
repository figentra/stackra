/**
 * Stackra file contract:
 * Purpose: `ShortcutEntry`, what `registerShortcuts` records for one shortcut class: its derived key and label, and
 *          its options read from the kind registry, with the binding split into steps for the keyboard driver.
 * Boundary: a type only, internal to the package; `./react`'s `ShortcutItem` is the public face of an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); registry v3.1 gen-core needs (item 4, the wiring).
 */
import type { AnyClass } from "@stackra/container";
import type { IconName } from "@stackra/icons/contracts";

import type { RunnableShortcut } from "#core/types/runnable-shortcut.type";

/** One registered shortcut. */
export interface ShortcutEntry {
  /** The shortcut class; the container builds it. */
  readonly type: AnyClass<RunnableShortcut>;

  /** The derived key, `<member>.<name>` (`console.open_palette`). */
  readonly key: string;

  /** The derived label's i18n key (`shortcuts::open_palette.label`). */
  readonly label: string;

  /** The palette group's i18n key. */
  readonly group: string;

  /** The binding in normal form, or `null` for a palette-only entry. */
  readonly keys: string | null;

  /** The binding's steps in normal form; one for a plain binding, more for a chord, none without a binding. */
  readonly steps: readonly string[];

  /** The palette icon, or `null`. */
  readonly icon: IconName | null;

  /** Extra palette search words. */
  readonly intents: readonly string[];
}
