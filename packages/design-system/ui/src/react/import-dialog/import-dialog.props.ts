/**
 * Stackra file contract:
 * Purpose: `ImportDialogProps`, the props of the web `ImportDialog`: the shared contract and `onRead` for a browser
 *          `File`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); STA-1371.
 */
import type { ImportDialogContractProps } from "#contracts/types/import-dialog-contract-props.type";
import type { ImportPreview } from "#contracts/types/import-preview.type";

/** Props of the web ImportDialog. */
export type ImportDialogProps = ImportDialogContractProps & {
  /** Reads the dropped or picked file: its columns, a sample and the row count. Reject to say it can't be read. */
  readonly onRead: (file: File) => Promise<ImportPreview>;
};
