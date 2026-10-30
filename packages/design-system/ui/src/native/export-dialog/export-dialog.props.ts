/**
 * Stackra file contract:
 * Purpose: `ExportDialogProps`, the props of the native ExportDialog: the shared contract.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); STA-1371.
 */
import type { ExportDialogContractProps } from "#contracts/types/export-dialog-contract-props.type";

/** Props of the native ExportDialog: the shared contract; the dialog's parts are its own. */
export type ExportDialogProps = ExportDialogContractProps;
