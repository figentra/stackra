/**
 * Stackra file contract:
 * Purpose: `ImportDialogProps`, the props of the native `ImportDialog`: the shared contract and `onRead` for a picked
 *          file.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); STA-1371.
 */
import type { ImportDialogContractProps } from "#contracts/types/import-dialog-contract-props.type";
import type { ImportPreview } from "#contracts/types/import-preview.type";
import type { PickedFile } from "#contracts/types/picked-file.type";

/** Props of the native ImportDialog. */
export type ImportDialogProps = ImportDialogContractProps & {
  /** Reads the picked file: its columns, a sample and the row count. Reject to say it can't be read. */
  readonly onRead: (file: PickedFile) => Promise<ImportPreview>;
};
