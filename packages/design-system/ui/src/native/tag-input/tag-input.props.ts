/**
 * Stackra file contract:
 * Purpose: `TagInputProps`, the props of the native `TagInput`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { TagInputContractProps } from "#contracts/types/tag-input-contract-props.type";

/** Props of the native TagInput. */
export type TagInputProps = TagInputContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
