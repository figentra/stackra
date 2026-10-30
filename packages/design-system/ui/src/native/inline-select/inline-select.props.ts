/**
 * Stackra file contract:
 * Purpose: `InlineSelectProps`, the props of the native `InlineSelect`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { InlineSelectContractProps } from "#contracts/types/inline-select-contract-props.type";

/** Props of the native InlineSelect. */
export type InlineSelectProps = InlineSelectContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
