/**
 * Stackra file contract:
 * Purpose: the native `Button` on HeroUI Native: maps the shared contract (`isLoading` to a blocked press, the `busy`
 *          state and a spinner in the label colour; `isFullWidth` to `w-full`; `label` to `accessibilityLabel`; a
 *          string label into `Button.Label`) and passes every other HeroUI Native prop through unchanged, the press
 *          feedback (`feedbackVariant`, `animation`, `background`) included.
 * Boundary: no styling of its own beyond `w-full` and the glass of the quiet variants (`useGlassButton`: secondary,
 *          tertiary and outline on Liquid Glass on iOS 26 and later, solid elsewhere, while disabled and under
 *          reduced transparency or more contrast). HeroUI
 *          Native neither sizes nor colours a button's icons, so the content sits in a `LucideProvider` that gives
 *          every Lucide icon the label's size and colour. An icon-only button is built through `IconButton`, so
 *          `isIconOnly` is not a prop here.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (HeroUI Native on native); owner
 *          decision 6 of STA-350; ADR 0319 (the glass quiet variants).
 */
import type { ReactElement } from "react";
import { Button as HeroButton, Spinner, cn, useThemeColor, type ThemeColor } from "heroui-native";
import { LucideProvider } from "lucide-react-native";

import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useGlassButton } from "#native/glass/use-glass-button";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import type { ButtonProps } from "#native/button/button.props";

/**
 * The theme colour of the label of each variant, from HeroUI Native's button stylesheet. It colours the spinner and
 * the icons; typed over every variant so a new one fails to compile until it has a colour.
 */
const LABEL_COLOR: Readonly<Record<ButtonVariant, ThemeColor>> = Object.freeze({
  primary: "accent-foreground",
  secondary: "accent-soft-foreground",
  tertiary: "default-foreground",
  outline: "default-foreground",
  ghost: "default-foreground",
  danger: "danger-foreground",
  "danger-soft": "danger-soft-foreground",
});

/**
 * A button on HeroUI Native. While `isLoading` the press is refused without the disabled dimming, the state reports
 * `busy`, and a spinner replaces the start icon. A string or number child becomes the label; HeroUI would crash on a
 * bare string beside an icon.
 */
export function Button({
  variant = "primary",
  size = "md",
  isDisabled = false,
  isLoading = false,
  isFullWidth = false,
  startIcon,
  endIcon,
  label,
  onPress,
  children,
  className,
  accessibilityState,
  ...rest
}: ButtonProps): ReactElement {
  const labelColor = useThemeColor(LABEL_COLOR[variant]);
  const glass = useGlassButton(variant, isDisabled);
  const isBlocked = isDisabled || isLoading;
  // `disabled` is not on HeroUI Native's props (it owns the pressable's flag through `isDisabled`), but its pressable
  // reads it after its own, so a spread is how a loading button stops pressing without the dimming `isDisabled`
  // adds. TypeScript checks no excess property on a JSX spread.
  const blocksPress = { disabled: isBlocked } as const;
  const content =
    typeof children === "string" || typeof children === "number" ? (
      <HeroButton.Label>{children}</HeroButton.Label>
    ) : (
      children
    );

  return (
    <HeroButton
      // Before the rest, so a caller's own `background` (or `null`) wins.
      {...(glass ? { background: glass.background } : {})}
      {...rest}
      variant={variant}
      size={size}
      isDisabled={isDisabled}
      {...blocksPress}
      {...omitUndefined({
        onPress,
        className: cn(isFullWidth && "w-full", glass?.className, className) || undefined,
      })}
      {...(label ? { accessibilityLabel: label } : {})}
      // Replaces HeroUI's own state whole, so the disabled flag is written again beside `busy`.
      accessibilityState={{ ...accessibilityState, disabled: isBlocked, busy: isLoading }}
    >
      <LucideProvider size={ICON_SIZES[size === "sm" ? "sm" : "md"]} color={labelColor}>
        {isLoading ? <Spinner size="sm" color={labelColor} /> : <SlotIcon icon={startIcon} />}
        {content}
        <SlotIcon icon={endIcon} />
      </LucideProvider>
    </HeroButton>
  );
}
