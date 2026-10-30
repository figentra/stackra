/**
 * Stackra file contract:
 * Purpose: `ProgressButtonProps`, the props of the native `ProgressButton` in `progress-button.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ButtonContractProps } from "#contracts/types/button-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import type { ButtonProps } from "#native/button/button.props";
import type { ProgressButtonContractProps } from "#contracts/types/progress-button-contract-props.type";

/** Props of the native ProgressButton: the shared contract plus the Button's own props, passed through. */
export type ProgressButtonProps = ProgressButtonContractProps &
  DistributiveOmit<ButtonProps, keyof ProgressButtonContractProps | keyof ButtonContractProps>;
