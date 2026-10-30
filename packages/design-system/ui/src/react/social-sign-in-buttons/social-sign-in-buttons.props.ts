/**
 * Stackra file contract:
 * Purpose: `SocialSignInButtonsProps`, the props of the web `SocialSignInButtons` in `social-sign-in-buttons.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { SocialSignInButtonsContractProps } from "#contracts/types/social-sign-in-buttons-contract-props.type";

/** Props of the web SocialSignInButtons: the shared contract plus the root's own props, passed through. */
export type SocialSignInButtonsProps = SocialSignInButtonsContractProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof SocialSignInButtonsContractProps | "children">;
