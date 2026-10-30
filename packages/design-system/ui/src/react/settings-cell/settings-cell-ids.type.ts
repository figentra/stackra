/**
 * Stackra file contract:
 * Purpose: `SettingsCellIds`, the ids of a web SettingsCell's title and description that its control is named and described by.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */

/** The ids a control is named and described by. */
export interface SettingsCellIds {
  /** The id of the title element that names the control. */
  readonly title: string;
  /** The id of the description element; undefined without one. */
  readonly description: string | undefined;
}
