/**
 * Stackra file contract:
 * Purpose: the native `Button` on HeroUI Native: maps the shared contract (`isLoading` to a blocked press, the `busy`
 *          state and a spinner in the label colour; `isFullWidth` to `w-full`; `label` to `accessibilityLabel`; a
 *          string label into `Button.Label`) and passes every other HeroUI Native prop through unchanged, the press
 *          feedback (`feedbackVariant`, `animation`, `background`) included.
 * Boundary: no styling of its own beyond `w-full`. HeroUI Native neither sizes nor colours a button's icons, so the
 *          content sits in a `LucideProvider` that gives every Lucide icon the label's size and colour. An icon-only
 *          button is built through `IconButton`, so `isIconOnly` is not a prop here.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (HeroUI Native on native); owner
 *          decision 6 of STA-350.
 */
import {
  Button as HeroButton,
  Spinner,
  cn,
  useThemeColor,
  type ButtonRootProps,
  type ThemeColor,
} from "heroui-native";
import { LucideProvider } from "lucide-react-native";

import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { ButtonContractProps } from "#contracts/types/button-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native Button: the shared contract plus HeroUI Native's own button props, passed through unchanged.
 * The omitted names are the contract's own: `label` is the accessible name, `isDisabled` and `isLoading` own the
 * pressable's `disabled`, and `IconButton` owns `isIconOnly`.
 */
export type ButtonProps = ButtonContractProps &
  DistributiveOmit<
    ButtonRootProps,
    keyof ButtonContractProps | "isIconOnly" | "accessibilityLabel" | "aria-label" | "disabled"
  >;

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
}: ButtonProps) {
  const labelColor = useThemeColor(LABEL_COLOR[variant]);
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
      {...rest}
      variant={variant}
      size={size}
      isDisabled={isDisabled}
      {...blocksPress}
      {...omitUndefined({ onPress, className: isFullWidth ? cn("w-full", className) : className })}
      {...(label ? { accessibilityLabel: label } : {})}
      // Replaces HeroUI's own state whole, so the disabled flag is written again beside `busy`.
      accessibilityState={{ ...accessibilityState, disabled: isBlocked, busy: isLoading }}
    >
      <LucideProvider size={ICON_SIZES[size === "sm" ? "sm" : "md"]} color={labelColor}>
        {isLoading ? <Spinner size="sm" color={labelColor} /> : startIcon}
        {content}
        {endIcon}
      </LucideProvider>
    </HeroButton>
  );
}
