/**
 * Stackra file contract:
 * Purpose: `SettingsOptions`, what `Settings({...})` takes: the levels the group's values may be held at, outermost
 *          first, and where its generated page sits in the navigation.
 * Boundary: a type only. The group key comes from the class name, the labels from the field paths, the page's title
 *           and permissions from the key, so none is an option.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 22); ADR 0294 (decision 20: derived identities).
 */
import type { SettingLevel } from "#core/types/setting-level.type";
import type { SettingsNavigation } from "#core/types/settings-navigation.type";

/** The options of a settings class. */
export interface SettingsOptions {
  /** The levels its values may be held at, outermost first; each field may narrow them with `@Setting({ scopes })`. */
  readonly scopes: readonly SettingLevel[];

  /** The page's navigation entry; a page without one is reached from the settings index only. */
  readonly navigation?: SettingsNavigation;
}
