/**
 * Stackra file contract:
 * Purpose: `ReactionButtonProps`, the props of the native `ReactionButton`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { ReactionButtonContractProps } from "#contracts/types/reaction-button-contract-props.type";

/** Props of the native ReactionButton. */
export type ReactionButtonProps = ReactionButtonContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
