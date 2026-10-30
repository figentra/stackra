/**
 * Stackra file contract:
 * Purpose: `AttachmentCardContractProps`, the props every runtime's `AttachmentCard` takes: one file attached to a
 *          message, a comment, an order or a record, with its type mark or thumbnail, name, type and size, an upload's
 *          progress or failure, and its open, download, retry and remove actions.
 * Boundary: types only; the upload itself and the file's bytes are the caller's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave C).
 */

/** Props shared by the web and native `AttachmentCard`. */
export interface AttachmentCardContractProps {
  /** The file name, shown as given (never translated); it also names the card's actions. */
  readonly name: string;
  /** The size in bytes, written in the locale's digits and unit. */
  readonly size?: number | undefined;
  /** The MIME type, which picks the type mark; left out, the extension picks it. */
  readonly type?: string | undefined;
  /** An image of the file (an image's own URL, a PDF's first page), drawn in place of the type mark. */
  readonly previewSrc?: string | undefined;
  /** How far an upload is, 0 to 100; given, the card shows the upload's bar in place of the type and size. */
  readonly progress?: number | undefined;
  /**
   * Why the upload failed; given, the card shows it in the danger tone (an empty string says "Upload failed"), with a
   * retry button when `onRetry` is set.
   */
  readonly error?: string | undefined;
  /** Called when the name is pressed, to open or preview the file; left out, the name is plain text. */
  readonly onOpen?: (() => void) | undefined;
  /** Called by the download button; left out, there is none. */
  readonly onDownload?: (() => void) | undefined;
  /** Called by the retry button of a failed upload; left out, there is none. */
  readonly onRetry?: (() => void) | undefined;
  /** Called by the remove button; left out, there is none. */
  readonly onRemove?: (() => void) | undefined;
}
