/**
 * Stackra file contract:
 * Purpose: `SettingsPage`, one generated settings page: its module key, the level it edits, the panels that list it,
 *          and the keys it renders.
 * Boundary: a type only, frozen data `settingsPage` builds. Navigation derives its route (`/settings/<key-kebab>`)
 *           from the key; `SettingsForm` renders the fields and writes at the scope.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 24: gen generates the settings page).
 */
import type { AnyClass } from "@stackra/container";

import type { SettingKey } from "#core/types/setting-key.type";
import type { SettingLevel } from "#core/types/setting-level.type";

/**
 * The page of module `K`.
 *
 * @example
 * <SettingsForm page={SettingsPages.messages} />
 */
export interface SettingsPage<K extends string = string> {
  /** The module key, which is the settings group's key. */
  readonly key: K;

  /** The level the page reads and writes. */
  readonly scope: SettingLevel;

  /** The panel classes whose navigation lists it. */
  readonly panels: readonly AnyClass[];

  /** The keys it renders, in declaration order. */
  readonly fields: readonly SettingKey[];
}
