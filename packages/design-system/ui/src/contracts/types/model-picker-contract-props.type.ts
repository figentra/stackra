/**
 * Stackra file contract:
 * Purpose: `ModelPickerContractProps`, the props every runtime's `ModelPicker` takes: the models, the picked one and
 *          its change, and the field's label.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { AiModel } from "#contracts/types/ai-model.type";

/** Props shared by the web and native `ModelPicker`. */
export interface ModelPickerContractProps {
  /** The models offered, grouped by provider in the list. */
  readonly models: readonly AiModel[];
  /** The picked model's id, for a controlled picker; `null` means none is picked. */
  readonly value?: string | null | undefined;
  /** The model picked at first, for an uncontrolled picker. */
  readonly defaultValue?: string | null | undefined;
  /** Called with the id of the model the person picks. */
  readonly onChange?: ((id: string) => void) | undefined;
  /** The field's name. Defaults to the catalogue's "Model". */
  readonly label?: string | undefined;
  /** False to hide the label (it still names the field), for a compact picker in a composer. Defaults to true. */
  readonly isLabelVisible?: boolean | undefined;
  /** True to show the picker but refuse changes. */
  readonly isDisabled?: boolean | undefined;
  /** True to fill the parent's width instead of the content's. */
  readonly isFullWidth?: boolean | undefined;
}
