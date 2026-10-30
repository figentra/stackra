/**
 * Stackra file contract:
 * Purpose: `SocialSignInButtonsProps`, the props of the native `SocialSignInButtons` in `social-sign-in-buttons.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewProps } from "react-native";
import type { SocialSignInButtonsContractProps } from "#contracts/types/social-sign-in-buttons-contract-props.type";

/** Props of the native SocialSignInButtons: the shared contract plus the root's own props, passed through. */
export type SocialSignInButtonsProps = SocialSignInButtonsContractProps &
  Omit<ViewProps, keyof SocialSignInButtonsContractProps>;
