/**
 * Stackra file contract:
 * Purpose: `ExportDialogProps`, the props of the web `ExportDialog` in `export-dialog.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); GAPS.md row 16
 *          (owner decision 2026-10-28, P1 + P2 core).
 */
import type { ExportDialogContractProps } from "#contracts/types/export-dialog-contract-props.type";

/** Props of the web ExportDialog: the shared contract; the dialog's parts are its own. */
export type ExportDialogProps = ExportDialogContractProps;
