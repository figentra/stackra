/**
 * Stackra file contract:
 * Purpose: `MorphButtonProps`, the props of the native `MorphButton` in `morph-button.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ButtonContractProps } from "#contracts/types/button-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import type { ButtonProps } from "#native/button/button.props";
import type { MorphButtonContractProps } from "#contracts/types/morph-button-contract-props.type";

/** Props of the native MorphButton: the shared contract plus the Button's own props, passed through. */
export type MorphButtonProps = MorphButtonContractProps &
  DistributiveOmit<ButtonProps, keyof MorphButtonContractProps | keyof ButtonContractProps>;
