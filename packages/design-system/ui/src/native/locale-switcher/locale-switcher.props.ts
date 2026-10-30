/**
 * Stackra file contract:
 * Purpose: `LocaleSwitcherProps`, the props of the native `LocaleSwitcher`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { LocaleSwitcherContractProps } from "#contracts/types/locale-switcher-contract-props.type";

/** Props of the native LocaleSwitcher. */
export type LocaleSwitcherProps = LocaleSwitcherContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
