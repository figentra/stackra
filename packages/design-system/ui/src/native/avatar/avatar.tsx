/**
 * Stackra file contract:
 * Purpose: the native `Avatar` on HeroUI Native's Avatar: the same contract as the web one, with the fallback icon in
 *          the tone's soft foreground through `LucideProvider`, the accessible name through the `accessibility*` props
 *          (never HeroUI's English "Avatar"), and the square class on the root and the fallback. Every other HeroUI
 *          Native root prop passes through, `animation` and `background` included.
 * Boundary: no styling of its own beyond the square class; the look is HeroUI Native's, themed by `@stackra/tokens`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0303 (decision 7); ADR 0304;
 *          owner decision 6 of STA-350 (thin wrappers).
 */
import type { ReactElement } from "react";
import { Avatar as HeroAvatar, cn, useThemeColor, type ThemeColor } from "heroui-native";
import { LucideProvider } from "lucide-react-native";

import { AVATAR_SQUARE_CLASS_NAME } from "#core/constants/avatar-square-class-name.constant";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { initialsOf } from "#core/functions/initials-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Icon } from "#native/icon/icon";
import type { AvatarProps } from "#native/avatar/avatar.props";

/** The initials stay on one line and shrink to the circle rather than truncate. */
const INITIALS_TEXT = Object.freeze({
  numberOfLines: 1,
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.5,
} as const);

/** The props of a decorative avatar: hidden from VoiceOver and TalkBack alike, with no name for HeroUI to invent. */
const HIDDEN = Object.freeze({
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
  alt: "",
} as const);

/**
 * A person's or organisation's picture, or the initials of its name when there is none. The picture is hidden from
 * assistive technology unless it has a `label`, because the name usually sits beside it in text. While an image
 * loads, HeroUI Native shows only the background, not the fallback.
 */
export function Avatar({
  name,
  src,
  label,
  size,
  tone = "default",
  variant,
  shape,
  fallback,
  className,
  ...rest
}: AvatarProps): ReactElement {
  const { locale } = useDesignSystem();
  // The colour HeroUI gives its own fallback text; a nested Lucide provider replaces every field, so both are set.
  const color = useThemeColor(`${tone}-soft-foreground` satisfies ThemeColor);
  const initials = name ? initialsOf(name, locale) : "";
  // A string or number stays bare, whether it is the caller's fallback or the initials: HeroUI Native draws a bare
  // string child as text, and one wrapped in a provider would reach a View, which React Native refuses.
  const isText = typeof fallback === "string" || typeof fallback === "number";
  const text = isText ? fallback : fallback === undefined && initials !== "" ? initials : undefined;
  const content = fallback ?? <Icon name="user-round" size={size ?? "md"} />;
  const isSquare = shape === "square";
  const accessibility = label
    ? { accessible: true, role: "img" as const, accessibilityLabel: label, alt: label }
    : HIDDEN;

  return (
    <HeroAvatar
      {...rest}
      {...accessibility}
      {...omitUndefined({ size, variant })}
      color={tone}
      className={cn(isSquare && AVATAR_SQUARE_CLASS_NAME, className) ?? ""}
    >
      {src ? <HeroAvatar.Image source={{ uri: src }} /> : null}
      {/* The fallback's own container is fully round, so it takes the square class too. */}
      <HeroAvatar.Fallback
        {...(isSquare ? { className: AVATAR_SQUARE_CLASS_NAME } : {})}
        // One line that shrinks to fit: iOS truncates a clipped label to an ellipsis, which hid the initials.
        textProps={INITIALS_TEXT}
      >
        {text !== undefined ? (
          text
        ) : (
          <LucideProvider size={ICON_SIZES[size ?? "md"]} color={color}>
            {content}
          </LucideProvider>
        )}
      </HeroAvatar.Fallback>
    </HeroAvatar>
  );
}
