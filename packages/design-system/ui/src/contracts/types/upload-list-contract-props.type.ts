/**
 * Stackra file contract:
 * Purpose: the props every runtime's `UploadList` takes: the files, the list's accessible name and the retry and
 *          remove handlers.
 * Boundary: types only; the caller owns the upload and re-renders the list as each file moves on.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); design-system gap inventory row 6.
 */
import type { UploadItem } from "#contracts/types/upload-item.type";

/** Props shared by the web and native `UploadList`. */
export interface UploadListContractProps {
  /** The files, in the order shown. */
  readonly items: readonly UploadItem[];
  /** The list's accessible name. Defaults to "Uploads". */
  readonly label?: string | undefined;
  /** Called with a failed file's id when its retry button is pressed; without it no retry button shows. */
  readonly onRetry?: ((id: string) => void) | undefined;
  /** Called with a file's id when its remove button is pressed; without it no remove button shows. */
  readonly onRemove?: ((id: string) => void) | undefined;
}
