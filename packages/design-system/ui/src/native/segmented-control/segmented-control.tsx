/**
 * Stackra file contract:
 * Purpose: the native `SegmentedControl`: a pill of exclusive choices with a raised thumb that springs to the chosen
 *          one, a radio group to VoiceOver and TalkBack, each change playing the selection haptic.
 * Boundary: the thumb is `useSegmentThumb` beside this file. The row follows the reading direction. Controlled by
 *           `selectedKey` or starting from `defaultSelectedKey` (else the first item).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import { cn, useThemeColor } from "heroui-native";
import { LucideProvider } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import type { ReactElement } from "react";

import type { Size } from "#contracts/enums/size.enum";
import { haptics } from "#native/haptics/haptics";
import type { SegmentedControlProps } from "#native/segmented-control/segmented-control.props";
import { useSegmentThumb } from "#native/segmented-control/use-segment-thumb";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import { Text } from "#native/text/text";

/** The segment height of each size; the class strings are literal so Uniwind finds them. */
const HEIGHT: Readonly<Record<Size, string>> = Object.freeze({ sm: "h-8", md: "h-9", lg: "h-11" });

/** A few exclusive choices with a sliding thumb (Day / Week / Month). */
export function SegmentedControl({
  items,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  label,
  isDisabled = false,
  size = "md",
  isFullWidth = false,
  className,
  ...rest
}: SegmentedControlProps): ReactElement {
  const [ownKey, setOwnKey] = useState(defaultSelectedKey ?? items[0]?.id);
  const selected = selectedKey ?? ownKey;
  const { thumbStyle, onSegmentLayout } = useSegmentThumb(selected);
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);

  const choose = (key: string) => {
    if (key === selected) return;
    haptics.play("selection");
    setOwnKey(key);
    onSelectionChange?.(key);
  };

  return (
    <View
      {...rest}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className={
        cn(
          "relative flex-row rounded-[var(--radius-pill)] bg-default p-1",
          isFullWidth ? "self-stretch" : "self-start",
          isDisabled && "opacity-50",
          className,
        ) ?? ""
      }
    >
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", top: 4, bottom: 4, left: 0 }, thumbStyle]}
        className="rounded-[var(--radius-pill)] bg-segment shadow-surface"
      />
      {items.map((item) => {
        const isSelected = item.id === selected;
        const isRefused = isDisabled || item.isDisabled === true;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityLabel={item.label}
            accessibilityState={{ checked: isSelected, disabled: isRefused }}
            disabled={isRefused}
            onLayout={(event) => onSegmentLayout(item.id, event)}
            onPress={() => choose(item.id)}
            className={
              cn(
                "flex-row items-center justify-center gap-1.5 rounded-[var(--radius-pill)] px-3",
                HEIGHT[size],
                isFullWidth && "flex-1",
                item.isDisabled && "opacity-50",
              ) ?? ""
            }
          >
            <LucideProvider color={isSelected ? foreground : muted} size={16}>
              <SlotIcon icon={item.icon} />
            </LucideProvider>
            <Text
              type={size === "lg" ? "body" : "small"}
              tone={isSelected ? "default" : "muted"}
              className="font-medium"
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
