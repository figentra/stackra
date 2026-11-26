/**
 * Stackra file contract:
 * Purpose: `SettingsFormState`, what `useSettingsForm` gives the web and native `SettingsForm`: the fields to draw and
 *          the three things a field does (write a value, keep a draft, write the draft).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 23 and 24).
 */
import type { SettingKey } from "#core/index";
import type { SettingsFormField } from "#react/settings-form/settings-form-field.type";

/** A settings form's fields and handlers. */
export interface SettingsFormState {
  /** The page's fields, in order. */
  readonly fields: readonly SettingsFormField[];
  /** Shows `value` and writes it, or marks the field when it breaks its key. */
  readonly save: (field: SettingKey, value: unknown) => void;
  /** Keeps typed text until it is committed. */
  readonly setDraft: (field: SettingKey, text: string) => void;
  /** Writes the field's typed text, if any is pending. */
  readonly commit: (field: SettingKey) => void;
  /** The latest field error, translated, for a polite live region; `""` when there is none. */
  readonly announced: string;
}
