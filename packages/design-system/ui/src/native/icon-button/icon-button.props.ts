/**
 * Stackra file contract:
 * Purpose: `IconButtonProps`, the props of the native `IconButton` in `icon-button.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); WCAG 2.2 SC 4.1.2 (name, role, value).
 */
import type { ButtonContractProps } from "#contracts/types/button-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import type { IconButtonContractProps } from "#contracts/types/icon-button-contract-props.type";
import type { ButtonProps } from "#native/button/button.props";

/** Props of the native IconButton: the shared contract plus the Button's pass-through props. */
export type IconButtonProps = IconButtonContractProps &
  DistributiveOmit<ButtonProps, keyof ButtonContractProps>;
