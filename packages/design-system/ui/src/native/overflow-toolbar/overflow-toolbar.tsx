/**
 * Stackra file contract:
 * Purpose: the native `OverflowToolbar`: a row with the toolbar role, named by `label`, that shows the actions as
 *          `Button`s in priority order, as many as fit its width, and the rest in an `ActionMenu` at the row's end. An
 *          invisible copy of the row measures every button with `onLayout`. A button that moves into or out of the
 *          menu fades in or out and the others slide (Reanimated layout animations at the theme's `fast` step, which
 *          follow the system's reduce-motion setting); a press plays the light haptic every Button plays.
 * Boundary: builds on `#native/button/button` and `#native/action-menu/action-menu`; the measuring copy is hidden from
 *           VoiceOver and TalkBack and takes no touches. The row follows the reading direction, so the menu sits at
 *           the reading end in RTL.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0329 (motion layer); design-system gap inventory row 33.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion } from "react-native-reanimated";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { overflowFitCount } from "#core/functions/overflow-fit-count.function";
import { ActionMenu } from "#native/action-menu/action-menu";
import { Button } from "#native/button/button";
import { IconButton } from "#native/icon-button/icon-button";
import type { OverflowToolbarProps } from "#native/overflow-toolbar/overflow-toolbar.props";

const FAST = motionTiming(STACKRA_THEME, "fast").durationMs;
const ENTERING = FadeIn.duration(FAST).reduceMotion(ReduceMotion.System);
const EXITING = FadeOut.duration(FAST).reduceMotion(ReduceMotion.System);
const LAYOUT = LinearTransition.duration(FAST).reduceMotion(ReduceMotion.System);
/** The row's `gap-2`, in points. */
const GAP = 8;

/** A named row of actions that keeps the first ones as buttons and moves the rest into a "more" menu when narrow. */
export function OverflowToolbar({
  label,
  items,
  moreLabel,
  variant = "tertiary",
  size,
  onAction,
  className,
  ...rest
}: OverflowToolbarProps): ReactElement {
  const [rowWidth, setRowWidth] = useState<number | undefined>(undefined);
  // The measured width of each button by key, and of the more button under `""`.
  const [widths, setWidths] = useState<Readonly<Record<string, number>>>({});
  const measured = [...items.map((item) => widths[item.id]), widths[""]];
  const count =
    rowWidth === undefined || measured.some((width) => width === undefined)
      ? items.length
      : overflowFitCount(measured.slice(0, -1) as number[], rowWidth, widths[""] ?? 0, GAP);
  const visible = items.slice(0, count);
  const overflow = items.slice(count);
  const shared = { variant, ...omitUndefined({ size }) };
  const measure = (key: string) => (width: number) =>
    setWidths((previous) => (previous[key] === width ? previous : { ...previous, [key]: width }));

  return (
    <View
      {...rest}
      className={["min-w-0", className].filter(Boolean).join(" ")}
      onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
    >
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="absolute flex-row gap-2 opacity-0"
      >
        {items.map((item) => (
          <View
            key={item.id}
            onLayout={(event) => measure(item.id)(event.nativeEvent.layout.width)}
          >
            <Button {...shared} {...omitUndefined({ startIcon: item.icon })}>
              {item.label}
            </Button>
          </View>
        ))}
        <View onLayout={(event) => measure("")(event.nativeEvent.layout.width)}>
          <IconButton icon="ellipsis" label={moreLabel} {...shared} />
        </View>
      </View>
      <View
        accessibilityRole="toolbar"
        accessibilityLabel={label}
        className="flex-row items-center gap-2"
      >
        {visible.map((item) => (
          <Animated.View key={item.id} entering={ENTERING} exiting={EXITING} layout={LAYOUT}>
            <Button
              {...shared}
              onPress={() => {
                item.onPress?.();
                onAction?.(item.id);
              }}
              {...omitUndefined({ startIcon: item.icon, isDisabled: item.isDisabled })}
            >
              {item.label}
            </Button>
          </Animated.View>
        ))}
        {overflow.length === 0 ? null : (
          <ActionMenu
            label={moreLabel}
            {...shared}
            sections={[{ id: "more", title: moreLabel, isTitleHidden: true, items: overflow }]}
            {...omitUndefined({ onAction })}
          />
        )}
      </View>
    </View>
  );
}
