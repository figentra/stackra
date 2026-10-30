/**
 * Stackra file contract:
 * Purpose: the props every runtime's `DropZone` takes: a dashed area that takes files dropped on it (web) or picked
 *          through its button (both).
 * Boundary: types only; each runtime's `onSelect` hands over its own file type (`File` on web, `PickedFile` on native).
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
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
}
