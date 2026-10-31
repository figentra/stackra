/**
 * Stackra file contract:
 * Purpose: `PromptInputProps`, the props of the native `PromptInput`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { PromptInputContractProps } from "#contracts/types/prompt-input-contract-props.type";

/** Props of the native PromptInput. */
export type PromptInputProps = PromptInputContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
