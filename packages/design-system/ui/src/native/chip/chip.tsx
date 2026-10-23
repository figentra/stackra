/**
 * Stackra file contract:
 * Purpose: the native `Chip` on HeroUI Native's Chip: maps the shared contract (`tone` to `color`, the web defaults
 *          passed explicitly, text into `Chip.Label`, icons sized and coloured through `LucideProvider` to the label)
 *          and passes every other HeroUI Native prop through, press handlers excepted.
 * Boundary: no styling of its own; `labelColor` mirrors HeroUI Native's label rules. A display element: HeroUI
 *          Native's root is a `Pressable`, and with no handler it reads to a screen reader as one element named by
 *          its text. Interaction is a TagGroup or a Button, never a chip.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0304 (decision 3); owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import { Chip as HeroChip, useThemeColor, type ThemeColor } from "heroui-native";
import { LucideProvider } from "lucide-react-native";
import type { ComponentPropsWithRef } from "react";

import type { ChipVariant } from "#contracts/enums/chip-variant.enum";
import type { Size } from "#contracts/enums/size.enum";
import type { Tone } from "#contracts/enums/tone.enum";
import type { ChipContractProps } from "#contracts/types/chip-contract-props.type";

/**
 * Props of the native Chip: the shared contract plus HeroUI Native's own chip props, passed through unchanged.
 * HeroUI's `color` is the contract's `tone`; the four press handlers are refused, as `onClick` is on web.
 */
export type ChipProps = ChipContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroChip>,
    keyof ChipContractProps | "color" | "onPress" | "onPressIn" | "onPressOut" | "onLongPress"
  >;

/** The size of an icon beside the label of each chip size: the label's own text size in points. */
const CHIP_ICON_SIZE: Readonly<Record<Size, number>> = Object.freeze({ sm: 12, md: 14, lg: 16 });

/**
 * The theme colour of a chip's text, which its icons take too: solid on `primary`, the soft foreground otherwise.
 * Taken from HeroUI Native's chip stylesheet.
 */
function labelColor(variant: ChipVariant, tone: Tone): ThemeColor {
  return variant === "primary" ? `${tone}-foreground` : `${tone}-soft-foreground`;
}

/**
 * A compact, non-interactive label. HeroUI Native defaults to a filled accent chip; the wrapper passes the web's
 * defaults (`secondary`, `default`, `md`) so one chip reads the same on both runtimes. A string or number child
 * becomes the label, which HeroUI Native would otherwise leave bare beside an icon.
 */
export function Chip({
  variant = "secondary",
  tone = "default",
  size = "md",
  startIcon,
  endIcon,
  children,
  ...rest
}: ChipProps) {
  const color = useThemeColor(labelColor(variant, tone));
  const isText = typeof children === "string" || typeof children === "number";
  return (
    <HeroChip {...rest} variant={variant} color={tone} size={size}>
      {/* Both fields: a nested Lucide provider replaces every one the app's provider set. */}
      <LucideProvider size={CHIP_ICON_SIZE[size]} color={color}>
        {startIcon}
        {isText ? <HeroChip.Label>{children}</HeroChip.Label> : children}
        {endIcon}
      </LucideProvider>
    </HeroChip>
  );
}
