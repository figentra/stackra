/**
 * Stackra file contract:
 * Purpose: `DropZoneProps`, the props of the web `DropZone`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { DropZoneContractProps } from "#contracts/types/drop-zone-contract-props.type";

/** Props of the web DropZone. */
export type DropZoneProps = DropZoneContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
  /** Called with the files dropped or picked. */
  readonly onSelect?: ((files: readonly File[]) => void) | undefined;
  /** With `showPreviews`, called with every file the zone now holds, after a file is taken or removed. */
  readonly onFilesChange?: ((files: readonly File[]) => void) | undefined;
};
