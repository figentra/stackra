/**
 * Stackra file contract:
 * Purpose: `EntityPickerBaseContractProps`: the props of an EntityPicker in either mode.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3: one API on web and
 *          native); ADR 0303 (decision 7, props vocabulary); ADR 0318 (wave 7 vocabulary); ADR 0055 (forms: one field
 *          contract); ADR 0165 (UI contract).
 */
import type { ReactNode } from "react";
import type { EntityOption } from "#contracts/types/entity-option.type";
import type { EntityOptionPage } from "#contracts/types/entity-option-page.type";

/** The props of an EntityPicker in either mode. */
export interface EntityPickerBaseContractProps {
  /**
   * Answers a search: the page of records that match `search` (an empty string asks for the first records), or the
   * page after `cursor`. A picker asks again when the user pauses typing and ignores an answer that a later request
   * has replaced. A rejection shows `loadErrorMessage` in the list; typing again asks again.
   */
  readonly loadOptions: (search: string, cursor?: string) => Promise<EntityOptionPage>;
  /** Text shown while the field is empty; it hints at what to pick and never replaces the label. */
  readonly placeholder?: string | undefined;
  /** True to fill the width of the parent instead of a fixed field width. */
  readonly isFullWidth?: boolean | undefined;
  /** How long, in milliseconds, the user must stop typing before a search starts. Defaults to 250. */
  readonly debounceMs?: number | undefined;
  /** The spoken name of the spinner while records load, for example "Loading people"; without it the spinner is silent. */
  readonly loadingLabel?: string | undefined;
  /** What the list says when no record matches, for example "No people found"; without it the list stays closed. */
  readonly emptyMessage?: ReactNode;
  /** What the list says when `loadOptions` rejects, for example "People could not be loaded. Type to try again." */
  readonly loadErrorMessage?: ReactNode;
  /**
   * Called with the typed text when the user picks the create-new row. It may return the new record, which is then
   * picked, or nothing, when the app handles the result itself. A rejection picks nothing, and the app reports it
   * (ADR 0139). The row shows only when `createLabel` is also given.
   */
  readonly onCreate?:
    | ((text: string) => EntityOption | void | Promise<EntityOption | void>)
    | undefined;
  /** The text of the create-new row from the typed text, for example `(text) => \`Add "${text}"\``. */
  readonly createLabel?: ((text: string) => string) | undefined;
}
