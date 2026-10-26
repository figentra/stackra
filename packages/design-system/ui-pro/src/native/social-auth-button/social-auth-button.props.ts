/**
 * Stackra file contract:
 * Purpose: `SocialAuthButtonProps`, props of the native SocialAuthButton: the shared contract plus HeroUI Native Pro's
 *          own props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import type { SocialAuthButton as HeroSocialAuthButton } from "heroui-native-pro/social-auth-button";
import type { ComponentPropsWithRef } from "react";

import type { SocialAuthButtonContractProps } from "#contracts/types/social-auth-button-contract-props.type";

/** Omit that keeps each member of a union apart, as HeroUI Native's button props are a union on `feedbackVariant`. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * Props of the native SocialAuthButton: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged.
 */
export type SocialAuthButtonProps = SocialAuthButtonContractProps &
  DistributiveOmit<
    ComponentPropsWithRef<typeof HeroSocialAuthButton>,
    keyof SocialAuthButtonContractProps
  >;
