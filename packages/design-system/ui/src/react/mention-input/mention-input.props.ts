/**
 * Stackra file contract:
 * Purpose: `MentionInputProps`, the props of the web `MentionInput` in `mention-input.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-1371 (wave C).
 */
import type { MentionInputContractProps } from "#contracts/types/mention-input-contract-props.type";

/** Props of the web MentionInput: the shared contract, a class name and the accessible name without a label. */
export type MentionInputProps = MentionInputContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
  /** The box's name for assistive technology when it has no visible `label`. */
  readonly "aria-label"?: string | undefined;
};
