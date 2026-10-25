/**
 * Stackra file contract:
 * Purpose: `ShortcutItem`, one entry of the palette as `useShortcuts` lists it and `useRunShortcut` runs it: the
 *          shortcut's derived key and label, its group, binding, icon and search words.
 * Boundary: a type only. Labels and groups are i18n keys the palette translates; `keys` is the binding in normal form,
 *           drawn by `ShortcutKeys`, never shown raw.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23: palette entries are shortcuts); ADR 0245 (intents).
 */
import type { AnyClass } from "@stackra/container";
import type { IconName } from "@stackra/icons/contracts";

import type { RunnableShortcut } from "#core/index";

/** One palette entry. */
export interface ShortcutItem {
  /** The shortcut class the entry runs. */
  readonly type: AnyClass<RunnableShortcut>;

  /** The derived key (`console.open_palette`); unique, so it is the list's React key. */
  readonly key: string;

  /** The label's i18n key (`shortcuts::open_palette.label`). */
  readonly label: string;

  /** The palette group's i18n key. */
  readonly group: string;

  /** The binding in normal form (`mod+k`); absent for a palette-only entry. */
  readonly keys?: string;

  /** The icon shown beside the label. */
  readonly icon?: IconName;

  /** Extra words the palette matches the entry by. */
  readonly intents?: readonly string[];
}
