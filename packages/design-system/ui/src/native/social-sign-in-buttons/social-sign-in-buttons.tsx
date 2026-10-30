/**
 * Stackra file contract:
 * Purpose: the native `SocialSignInButtons`: one outline Button per provider, full width with "Continue with …" and the
 *          provider's mark, or a row of mark-only IconButtons; the provider whose sign-in runs shows a spinner and the
 *          others refuse presses. A provider without a mark gets a neutral letter mark, never a brand asset.
 * Boundary: builds on `#native/button/button` and `#native/icon-button/icon-button`. The provider's name is isolated
 *           inside the words, so a Latin name reads right in an Arabic sentence. The sign-in flow is the app's.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28); ADR 0060 (RTL
 *          and Arabic).
 */
import { cn, useThemeColor } from "heroui-native";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { ReactElement } from "react";

import type { SocialProvider } from "#contracts/types/social-provider.type";
import { SOCIAL_MARKS } from "#core/constants/social-marks.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { socialMarkOf } from "#core/functions/social-mark-of.function";
import { isolateText } from "#core/functions/isolate-text.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { IconButton } from "#native/icon-button/icon-button";
import type { SocialSignInButtonsProps } from "#native/social-sign-in-buttons/social-sign-in-buttons.props";
import { Text } from "#native/text/text";

/** How the envelope is outlined. */
const STROKE = { strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** The provider's custom mark, its built-in one, or its first letter in a soft circle. */
function markOf(provider: SocialProvider, ink: string) {
  const mark = socialMarkOf(provider);
  if (provider.icon === undefined && mark !== undefined) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false} testID={`mark-${mark}`}>
        {SOCIAL_MARKS[mark].map((path) => (
          <Path
            key={path.d}
            d={path.d}
            fill={path.stroke ? "none" : (path.fill ?? ink)}
            {...(path.stroke ? { ...STROKE, stroke: ink } : {})}
          />
        ))}
      </Svg>
    );
  }
  return (
    provider.icon ?? (
      <View className="size-5 items-center justify-center rounded-full bg-default">
        <Text type="caption" className="font-semibold">
          {provider.name.slice(0, 1)}
        </Text>
      </View>
    )
  );
}

/** "Continue with …" buttons, one per sign-in provider. */
export function SocialSignInButtons({
  providers,
  onSignIn,
  orientation = "vertical",
  pendingId,
  labelOf,
  isDisabled = false,
  className,
  ...rest
}: SocialSignInButtonsProps): ReactElement {
  const t = useUiText();
  // Apple's and X's marks follow the text: black on light, white on dark.
  const ink = useThemeColor("foreground");
  const words = (provider: SocialProvider) =>
    labelOf?.(provider) ??
    t(UI_KEYS.ui.social_sign_in.continue_with, { provider: isolateText(provider.name) });
  const isRow = orientation === "horizontal";

  return (
    <View {...rest} className={cn(isRow ? "flex-row flex-wrap gap-2" : "gap-2", className) ?? ""}>
      {providers.map((provider) => {
        const shared = {
          variant: "outline",
          isLoading: pendingId === provider.id,
          isDisabled: isDisabled || (pendingId !== undefined && pendingId !== provider.id),
          onPress: () => onSignIn?.(provider.id),
        } as const;
        return isRow ? (
          <IconButton
            key={provider.id}
            {...shared}
            label={words(provider)}
            icon={markOf(provider, ink)}
          />
        ) : (
          <Button key={provider.id} {...shared} isFullWidth startIcon={markOf(provider, ink)}>
            {words(provider)}
          </Button>
        );
      })}
    </View>
  );
}
