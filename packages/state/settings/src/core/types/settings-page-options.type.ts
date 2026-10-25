/**
 * Stackra file contract:
 * Purpose: `SettingsPageOptions`, what `settingsPage(key, {...})` takes: the level the page edits and the panels that
 *          list it.
 * Boundary: a type only, data gen writes in a member's `#stackra/settings`. A page at the user level edits the
 *           signed-in person's own values and needs no permission beyond being signed in; any other is gated by its
 *           module's `<module>.settings.update` permission.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 24); ADR 0213 (decision 8: user preferences).
 */
import type { AnyClass } from "@stackra/container";

import type { SettingLevel } from "#core/types/setting-level.type";

/** The options of a settings page. */
export interface SettingsPageOptions {
  /** The level the page reads and writes. */
  readonly scope: SettingLevel;

  /** The panel classes whose navigation lists the page; none for a page reached by its route only. */
  readonly panels?: readonly AnyClass[];
}
