/**
 * Stackra file contract:
 * Purpose: `VoiceInputProps`, the props of the web `VoiceInput`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { VoiceInputContractProps } from "#contracts/types/voice-input-contract-props.type";

/** Props of the web VoiceInput. */
export type VoiceInputProps = VoiceInputContractProps & {
  /** Styles the row that holds the button, the level and the status. */
  readonly className?: string | undefined;
};
