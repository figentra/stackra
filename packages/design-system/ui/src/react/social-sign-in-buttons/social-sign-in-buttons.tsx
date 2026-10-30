/**
 * Stackra file contract:
 * Purpose: the web `SocialSignInButtons`: one outline Button per provider, full width with "Continue with …" and the
 *          provider's mark, or a row of mark-only IconButtons; the provider whose sign-in runs shows a spinner and the
 *          others refuse presses. Apple, Google, Microsoft, X, Facebook and email get
 *          their built-in mark (custom `icon` wins); any other provider gets a neutral letter mark.
 * Boundary: builds on `#react/button/button` and `#react/icon-button/icon-button`. The provider's name is isolated
 *           inside the words, so a Latin name reads right in an Arabic sentence. The sign-in flow is the app's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28); ADR 0060 (RTL
 *          and Arabic).
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";

import type { SocialProvider } from "#contracts/types/social-provider.type";
import { SOCIAL_MARKS } from "#core/constants/social-marks.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { socialMarkOf } from "#core/functions/social-mark-of.function";
import { isolateText } from "#core/functions/isolate-text.function";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import type { SocialSignInButtonsProps } from "#react/social-sign-in-buttons/social-sign-in-buttons.props";

/** How the envelope is outlined. */
const STROKE = { strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** The provider's custom mark, its built-in one, or its first letter in a soft circle. */
function markOf(provider: SocialProvider) {
  const mark = socialMarkOf(provider);
  if (provider.icon === undefined && mark !== undefined) {
    return (
      <svg
        aria-hidden="true"
        data-mark={mark}
        viewBox="0 0 24 24"
        className="size-5 shrink-0 text-foreground"
      >
        {SOCIAL_MARKS[mark].map((path) => (
          <path
            key={path.d}
            d={path.d}
            fill={path.stroke ? "none" : (path.fill ?? "currentColor")}
            {...(path.stroke ? { ...STROKE, stroke: "currentColor" } : {})}
          />
        ))}
      </svg>
    );
  }
  return (
    provider.icon ?? (
      // The initial is drawn from an attribute, not text: an icon-only button is named by its words, and axe cannot
      // match a lone letter against them.
      <span
        aria-hidden="true"
        data-glyph={provider.name.slice(0, 1)}
        className="inline-flex size-5 items-center justify-center rounded-[var(--radius-pill)] bg-default text-xs font-semibold before:content-[attr(data-glyph)]"
      />
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
  const words = (provider: SocialProvider) =>
    labelOf?.(provider) ??
    t(UI_KEYS.ui.social_sign_in.continue_with, { provider: isolateText(provider.name) });
  const isRow = orientation === "horizontal";

  return (
    <div
      {...rest}
      data-slot="social-sign-in-buttons"
      className={cn(isRow ? "flex flex-wrap gap-2" : "grid gap-2", className)}
    >
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
            icon={markOf(provider)}
          />
        ) : (
          <Button key={provider.id} {...shared} isFullWidth startIcon={markOf(provider)}>
            {words(provider)}
          </Button>
        );
      })}
    </div>
  );
}
