/**
 * Stackra file contract:
 * Purpose: `DropZoneProps`, the props of the native `DropZone`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { PickedFile } from "#contracts/types/picked-file.type";
import type { DropZoneContractProps } from "#contracts/types/drop-zone-contract-props.type";

/** Props of the native DropZone. */
export type DropZoneProps = DropZoneContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
  /** Called with the files picked. */
  readonly onSelect?: ((files: readonly PickedFile[]) => void) | undefined;
};
