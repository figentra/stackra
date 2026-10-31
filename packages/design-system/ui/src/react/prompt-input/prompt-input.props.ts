/**
 * Stackra file contract:
 * Purpose: `PromptInputProps`, the props of the web `PromptInput`: the shared contract, the files dropped on it and a
 *          class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { PromptInputContractProps } from "#contracts/types/prompt-input-contract-props.type";

/** Props of the web PromptInput. */
export type PromptInputProps = PromptInputContractProps & {
  /** Called with the files dropped on the composer; set it to accept drops (the border turns dashed while dragging). */
  readonly onFilesDrop?: ((files: readonly File[]) => void) | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
};
