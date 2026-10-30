/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SaveStatus` takes: the autosave state and the text of each state. Each
 *          runtime's `SaveStatusProps` is this plus its own base props.
 * Boundary: types only. The status never saves: the app sets `state` from its autosave.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.3 (status messages); design-system
 *          gap inventory row 8.
 */
import type { SaveState } from "#contracts/enums/save-state.enum";

/** Props shared by the web and native `SaveStatus`. */
export interface SaveStatusContractProps {
  /** Where the autosave is; `idle` draws nothing. */
  readonly state: SaveState;
  /** The text while saving. Defaults to the `ui` catalogue's "Saving". */
  readonly savingLabel?: string | undefined;
  /** The text once saved, for example "Saved at 14:05". Defaults to the `ui` catalogue's "All changes saved". */
  readonly savedLabel?: string | undefined;
  /** The text when the save failed. Defaults to the `ui` catalogue's "Couldn't save". */
  readonly failedLabel?: string | undefined;
}
