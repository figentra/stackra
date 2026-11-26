/**
 * Stackra file contract:
 * Purpose: `SettingsFormField`, one field of a settings page as the web and native `SettingsForm` draw it: the key,
 *          the props every field part takes, which control it is and what it shows.
 * Boundary: a type only; `useSettingsForm` builds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 23 and 24); ADR 0302 (decision 3: one API on web and native).
 */
import type { SettingKey } from "#core/index";

/** One drawable settings field. */
export interface SettingsFormField {
  /** The key the field edits. */
  readonly field: SettingKey;
  /** The props the switch and the text field both take, already translated. */
  readonly shared: {
    readonly label: string;
    readonly description: string | undefined;
    readonly isReadOnly: boolean;
    readonly isInvalid: boolean;
    readonly errorMessage: string | undefined;
  };
  /** A boolean key, drawn as a switch. */
  readonly isBoolean: boolean;
  /** A text or connection key, as opposed to a number key. */
  readonly isText: boolean;
  /** The switch's state. */
  readonly checked: boolean;
  /** The text field's text: the pending draft, else the stored value. */
  readonly text: string;
}
