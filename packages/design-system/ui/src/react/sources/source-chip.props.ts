/**
 * Stackra file contract:
 * Purpose: `SourceChipProps`, the props of the web `SourceChip`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { SourceChipContractProps } from "#contracts/types/source-chip-contract-props.type";

/** Props of the web SourceChip. */
export type SourceChipProps = SourceChipContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
