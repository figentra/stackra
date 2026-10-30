/**
 * Stackra file contract:
 * Purpose: `RecurrenceEditorProps`, the props of the native `RecurrenceEditor`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { RecurrenceEditorContractProps } from "#contracts/types/recurrence-editor-contract-props.type";

/** Props of the native RecurrenceEditor. */
export type RecurrenceEditorProps = RecurrenceEditorContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
