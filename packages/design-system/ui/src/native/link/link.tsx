/**
 * Stackra file contract:
 * Purpose: the native `Link` on HeroUI Native's LinkButton: maps the shared contract onto LinkButton and
 *          LinkButton.Label with the link role, opens absolute and external URLs with `Linking` and hands app paths
 *          to the nearest native `RouterProvider`; every other LinkButton prop passes through. HeroUI Native has no
 *          link of its own, so this is the documented adapted form on its free LinkButton.
 * Boundary: renders LinkButton; no React Navigation import. A link inside running text is the Text component's
 *          concern (a nested pressable text), not this standalone form.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 5 and 7); ADR 0165 (HeroUI Native on native); owner
 *          decision 6 of STA-350.
 */
import { LinkButton, type LinkButtonProps } from "heroui-native";
import { use } from "react";
import { Linking } from "react-native";

import type { LinkContractProps } from "#contracts/types/link-contract-props.type";
import { TONE_CLASS_NAME } from "#core/constants/tone-class-name.constant";
import { Icon } from "#native/icon/icon";
import { RouterContext } from "#native/router-provider/router-context";

/** An absolute URL: it starts with a scheme (`https:`, `mailto:`, `tel:`, the app's own). */
const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;

// shortcut: English until @stackra/i18n ships; then the key `ui::link.opens-in-browser`.
const STRINGS = {
  opensInBrowser: "opens in your browser",
  couldNotOpen: "Link could not open its URL",
} as const;

/**
 * Props of the native Link: the shared contract plus HeroUI Native's LinkButton props, passed through unchanged. The
 * omitted names are the contract's own (`label`) or the wrapper's (the role, and the state HeroUI computes from
 * `isDisabled`).
 */
export type LinkProps = LinkContractProps &
  Omit<
    LinkButtonProps,
    | keyof LinkContractProps
    | "accessibilityRole"
    | "accessibilityState"
    | "accessibilityLabel"
    | "aria-label"
  >;

/**
 * A text link on HeroUI Native's LinkButton. A press calls `onPress`, then opens `href`: an absolute URL or an
 * external link in the system browser, an app path through the nearest `RouterProvider` (or the browser when there
 * is none).
 */
export function Link({
  href,
  onPress,
  isDisabled = false,
  isExternal = false,
  tone = "default",
  underline = "always",
  label,
  externalLabel = STRINGS.opensInBrowser,
  children,
  accessibilityHint,
  ...rest
}: LinkProps) {
  const navigate = use(RouterContext);
  const follow = () => {
    onPress?.();
    if (!href) return;
    if (navigate && !isExternal && !HAS_SCHEME.test(href)) {
      navigate(href);
      return;
    }
    // The URL stays out of the warning: it may hold a token.
    Linking.openURL(href).catch(() => console.warn(STRINGS.couldNotOpen));
  };
  // Written out in full: Uniwind finds `text-link` and `underline` here, and `default` has no entry in the map.
  const toneClass = tone === "default" ? "text-link" : TONE_CLASS_NAME[tone];
  const hint = isExternal ? externalLabel : accessibilityHint;

  return (
    <LinkButton
      hitSlop={8}
      {...rest}
      isDisabled={isDisabled}
      onPress={follow}
      {...(label ? { accessibilityLabel: label } : {})}
      {...(hint ? { accessibilityHint: hint } : {})}
      accessibilityRole="link"
    >
      <LinkButton.Label className={underline === "always" ? `${toneClass} underline` : toneClass}>
        {children}
      </LinkButton.Label>
      {isExternal ? (
        <Icon
          name="external-link"
          size="sm"
          tone={tone === "default" ? undefined : tone}
          isMirroredInRtl
        />
      ) : null}
    </LinkButton>
  );
}
