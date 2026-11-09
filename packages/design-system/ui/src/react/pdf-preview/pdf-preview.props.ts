/**
 * Stackra file contract:
 * Purpose: `PdfPreviewProps`, the props of the web PdfPreview: the link to the PDF, its name and the download.
 * Boundary: props only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); Tamo spec generative-ui-tools-artifacts (G4)
 */

/** Props of `PdfPreview`. */
export interface PdfPreviewProps {
  /**
   * The PDF's link: a short-lived signed URL minted for this open, on another origin than the page (object storage).
   * A same-origin link is shown with scripts off, so the frame can never lift its own sandbox.
   */
  readonly src: string;

  /** The file name, shown as given; it names the frame and the download button. */
  readonly name: string;

  /** Called by the download button, the fallback where the browser shows no PDF; left out, there is none. */
  readonly onDownload?: (() => void) | undefined;

  /** Styles the root. */
  readonly className?: string | undefined;
}
