/**
 * Stackra file contract:
 * Purpose: `DisclosureProps`, the props of the native `Disclosure`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */
import type { DisclosureContractProps } from "#contracts/types/disclosure-contract-props.type";

/** Props of the native Disclosure. */
export type DisclosureProps = DisclosureContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
