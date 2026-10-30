/**
 * Stackra file contract:
 * Purpose: the props every runtime's `InlineEdit` takes: the field contract over the saved text (`onChange` fires on
 *          save, not on each key), a check run before saving, the text shown while empty, and the spoken names of the
 *          edit, save and cancel controls.
 * Boundary: types only. A save the app must confirm with a server is the app's: it takes `onChange` and sets the value
 *           back if the server refuses.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 5 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0303
 *          (decision 7); ADR 0055 (forms: one field contract).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `InlineEdit`. */
export interface InlineEditContractProps extends FieldContractProps<string> {
  /** Checks the draft before it is saved; a message keeps the editor open and shows it as the error. */
  readonly validate?: ((draft: string) => string | undefined) | undefined;
  /** The muted text shown in read mode while the value is empty, and inside the empty input. */
  readonly placeholder?: string | undefined;
  /** The spoken name of the read-mode value, which opens the editor. Defaults to the `ui` catalogue's "Edit". */
  readonly editLabel?: string | undefined;
  /** The spoken name of the save button. Defaults to the `ui` catalogue's "Save". */
  readonly saveLabel?: string | undefined;
  /** The spoken name of the cancel button. Defaults to the `ui` catalogue's "Cancel". */
  readonly cancelLabel?: string | undefined;
}
