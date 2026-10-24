/**
 * Stackra file contract:
 * Purpose: the native `SocialAuthButton` on HeroUI Native Pro's SocialAuthButton (a button with a provider icon and
 *          label for social sign-in): it maps `size` and `isDisabled`; every other prop, `provider`, `label`,
 *          `iconProps`, `variant` and `onPress` included, passes through.
 * Boundary: no behaviour or styling of its own. `label` stays HeroUI Native Pro's: the visible text, which also
 *          names the button for screen readers. It is a single component with no parts.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import { SocialAuthButton as HeroSocialAuthButton } from "heroui-native-pro/social-auth-button";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { SocialAuthButtonContractProps } from "#contracts/types/social-auth-button-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

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

/**
 * A social sign-in button: pass the `provider` and HeroUI Native Pro draws its icon and a default label; `label`
 * overrides the text, and children replace the icon and the label.
 */
export function SocialAuthButton({
  size,
  isDisabled,
  ...rest
}: SocialAuthButtonProps): ReactElement {
  return <HeroSocialAuthButton {...rest} {...omitUndefined({ size, isDisabled })} />;
}
