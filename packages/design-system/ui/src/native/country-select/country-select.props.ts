/**
 * Stackra file contract:
 * Purpose: `CountrySelectProps`, the props of the native `CountrySelect`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { CountrySelectContractProps } from "#contracts/types/country-select-contract-props.type";

/** Props of the native CountrySelect. */
export type CountrySelectProps = CountrySelectContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
