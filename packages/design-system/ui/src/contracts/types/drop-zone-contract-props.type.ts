/**
 * Stackra file contract:
 * Purpose: the props every runtime's `DropZone` takes: a dashed area that takes files dropped or pasted on it (web) or
 *          picked through its buttons (both), with an optional camera button and a preview list of the files taken.
 * Boundary: types only; each runtime's `onSelect` hands over its own file type (`File` on web, `PickedFile` on native).
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); STA-1371 (wave C).
 */

/** Props shared by the web and native `DropZone`. */
export interface DropZoneContractProps {
  /** The headline in the zone; defaults to the `ui` catalogue's phrase. */
  readonly label?: string | undefined;
  /** A line under it, for example the accepted types and size. */
  readonly description?: string | undefined;
  /** The MIME types or extensions accepted; all when empty. */
  readonly acceptedFileTypes?: readonly string[] | undefined;
  /** True to take more than one file. */
  readonly allowsMultiple?: boolean | undefined;
  /** True to refuse drops and picks. */
  readonly isDisabled?: boolean | undefined;
  /** True to add a "Take a photo" button beside the file button (the camera on a phone, the webcam picker on web). */
  readonly allowsCamera?: boolean | undefined;
  /**
   * Web: true to take files pasted anywhere on the page (a copied screenshot), not only while the zone has focus;
   * a paste into a text field is left to that field. Native has no file clipboard and ignores it.
   */
  readonly allowsPaste?: boolean | undefined;
  /** True to keep the files taken and list them under the zone, an image as its thumbnail, each with a remove button. */
  readonly showPreviews?: boolean | undefined;
}
