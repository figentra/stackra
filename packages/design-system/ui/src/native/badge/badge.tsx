/**
 * Stackra file contract:
 * Purpose: the native `Badge`, the documented adapted form (HeroUI Native has no Badge): a HeroUI Native Chip drawn
 *          at the web Badge's sizes and pinned to a corner of a relative `View` anchor through React Native's logical
 *          `start` and `end` sides, hidden from VoiceOver and TalkBack unless labelled, and never taking a press.
 * Boundary: the sizes and corner offsets are copied from `@heroui/styles` 3.2.6 `badge.css`; no other styling. The
 *          press handlers are refused by the type, and `pointerEvents="none"` lets a press reach the anchor.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decisions 3 and 5: parity, adapted form); ADR 0165 (HeroUI Native on native);
 *          ADR 0304; ADR 0060; owner decision 6 of STA-350 (thin wrappers).
 */
// Uniwind adds `className` to React Native's own components, which the anchor `View` takes; HeroUI Native's
// components already have it.
/// <reference types="uniwind/types" />
import { Chip, cn, type ChipProps } from "heroui-native";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import type { Size } from "#contracts/enums/size.enum";
import type { BadgeAnchorContractProps } from "#contracts/types/badge-anchor-contract-props.type";
import type { BadgeContractProps } from "#contracts/types/badge-contract-props.type";

/**
 * Props of the native Badge: the shared contract plus the HeroUI Native Chip props a non-pressable badge can use.
 * HeroUI's `color` is the contract's `tone`; `label` owns the accessibility props; the press-state `style` function
 * is not taken, because the wrapper composes `style` as an array.
 */
export type BadgeProps = BadgeContractProps &
  Omit<
    ChipProps,
    | keyof BadgeContractProps
    | "color"
    | "style"
    | "disabled"
    | "pointerEvents"
    | "onPress"
    | "onLongPress"
    | "onPressIn"
    | "onPressOut"
    | "accessible"
    | "accessibilityLabel"
    | "aria-label"
  > & {
    /** Styles drawn after the corner position, so a caller can nudge the badge; a press-state function is not taken. */
    readonly style?: StyleProp<ViewStyle>;
  };

/** Props of the native Badge.Anchor: the shared contract plus React Native's view props. */
export type BadgeAnchorProps = BadgeAnchorContractProps & Omit<ViewProps, "children">;

/**
 * The web Badge's sizes as classes, copied from `@heroui/styles` 3.2.6 `badge.css` so both runtimes draw the same
 * badge. The class strings are literal so Uniwind finds them; `px-0 py-0` replaces the Chip's own padding. Typed over
 * every size so a new one fails to compile until it has values.
 */
const BADGE_CLASS_NAME: Readonly<Record<Size, { readonly root: string; readonly label: string }>> =
  Object.freeze({
    sm: {
      root: "min-h-4 min-w-4 px-0 py-0 rounded-xl border border-background",
      label: "px-0.5 text-[10px] leading-[1.34]",
    },
    md: {
      root: "min-h-7 min-w-7 px-0 py-0 rounded-3xl border border-background",
      label: "px-0.5 text-xs leading-[1.34]",
    },
    lg: {
      root: "min-h-8 min-w-8 px-0 py-0 rounded-2xl border border-background",
      label: "px-0.5 text-sm leading-[1.43]",
    },
  });

/**
 * How far the badge hangs off its corner, in points: a quarter of the minimum size, as the web badge's translate. A
 * fixed pixel rather than a percentage transform, so a wide count sits a few points off the web position.
 */
const BADGE_OFFSET: Readonly<Record<Size, number>> = Object.freeze({ sm: 4, md: 7, lg: 8 });

/** What a screen reader skips: not focusable, and none of its descendants either, on iOS and Android. */
const HIDDEN_FROM_READERS = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

/** The badge itself; reached as `Badge`, with the anchor as `Badge.Anchor`. */
function BadgeRoot({
  tone = "default",
  variant = "primary",
  size = "md",
  placement = "top-end",
  label,
  children,
  className,
  style,
  ...rest
}: BadgeProps) {
  const offset = -BADGE_OFFSET[size];
  // Logical sides: Yoga flips `start` and `end` with the layout direction, while `left` and `right` are swapped by
  // I18nManager already, so physical sides would flip twice.
  const position: ViewStyle = {
    position: "absolute",
    [placement.startsWith("top") ? "top" : "bottom"]: offset,
    [placement.endsWith("end") ? "end" : "start"]: offset,
  };
  const isText = typeof children === "string" || typeof children === "number";

  return (
    <Chip
      {...rest}
      variant={variant}
      color={tone}
      size={size}
      className={cn(BADGE_CLASS_NAME[size].root, className) ?? ""}
      style={[position, style]}
      // A badge overlaps its anchor's corner, so a press on it must reach the anchor.
      pointerEvents="none"
      {...(label
        ? { accessible: true, accessibilityRole: "text", accessibilityLabel: label }
        : HIDDEN_FROM_READERS)}
    >
      {isText ? (
        <Chip.Label className={BADGE_CLASS_NAME[size].label}>{children}</Chip.Label>
      ) : (
        children
      )}
    </Chip>
  );
}

/** The element a badge is pinned to: a relative box that shrinks to its content. */
function BadgeAnchor({ className, ...rest }: BadgeAnchorProps) {
  return <View {...rest} className={cn("relative self-start", className) ?? ""} />;
}

/**
 * A count or dot pinned to a corner of another element. The corner is named by the reading direction, so `top-end` is
 * top left under right-to-left. Hidden from assistive technology unless it has a `label`.
 */
export const Badge = Object.assign(BadgeRoot, {
  /** The anchored element first, then the `Badge`, which is drawn on top of it. */
  Anchor: BadgeAnchor,
});
