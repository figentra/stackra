/**
 * Stackra file contract:
 * Purpose: `WheelColumn`, one wheel of the native WheelPicker: a snapping ScrollView whose centred row is the choice,
 *          with a selection haptic each time it settles on a new one.
 * Boundary: internal. VoiceOver and TalkBack read it as an adjustable control named by the column and valued by the
 *           centred row; swiping up or down steps it. It settles on the nearest enabled row (`wheelIndexOf`).
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 4.1.2.
 */
import { useEffect, useRef, type ReactElement } from "react";
import {
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import type { WheelPickerColumn } from "#contracts/types/wheel-picker-column.type";
import { wheelIndexOf } from "#core/functions/wheel-index-of.function";
import { WHEEL_ROW } from "#native/wheel-picker/wheel-row.constant";
import { haptics } from "#native/haptics/haptics";
import { Text } from "#native/text/text";

/** Draws one scrolling wheel of a wheel picker. */
export function WheelColumn({
  column,
  selected,
  onSelect,
  visibleCount,
  isDisabled,
}: {
  readonly column: WheelPickerColumn;
  readonly selected: string | undefined;
  readonly onSelect: (id: string) => void;
  readonly visibleCount: number;
  readonly isDisabled: boolean;
}): ReactElement {
  const ref = useRef<ScrollView>(null);
  const found = column.items.findIndex((item) => item.id === selected);
  const index = found < 0 ? 0 : found;

  useEffect(() => {
    ref.current?.scrollTo({ y: index * WHEEL_ROW, animated: true });
  }, [index]);

  const choose = (next: number) => {
    const item = column.items[next];
    if (isDisabled || !item || item.isDisabled || item.id === selected) return;
    haptics.play("selection");
    onSelect(item.id);
  };
  const step = (by: number) => {
    for (let at = index + by; at >= 0 && at < column.items.length; at += by) {
      if (!column.items[at]?.isDisabled) return choose(at);
    }
  };
  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = wheelIndexOf(event.nativeEvent.contentOffset.y, WHEEL_ROW, column.items);
    if (next === index || next < 0) ref.current?.scrollTo({ y: index * WHEEL_ROW, animated: true });
    else choose(next);
  };

  return (
    <View
      className="flex-1"
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={column.label}
      accessibilityValue={{ text: column.items[index]?.label ?? "" }}
      accessibilityState={{ disabled: isDisabled }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => step(event.nativeEvent.actionName === "increment" ? 1 : -1)}
    >
      <ScrollView
        ref={ref}
        scrollEnabled={!isDisabled}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ROW}
        decelerationRate="fast"
        onMomentumScrollEnd={settle}
        style={{ height: WHEEL_ROW * visibleCount }}
        contentContainerStyle={{ paddingVertical: (WHEEL_ROW * (visibleCount - 1)) / 2 }}
        contentOffset={{ x: 0, y: index * WHEEL_ROW }}
      >
        {column.items.map((item, row) => (
          <Pressable
            key={item.id}
            onPress={() => choose(row)}
            importantForAccessibility="no"
            style={{ height: WHEEL_ROW }}
            className={`items-center justify-center ${item.isDisabled ? "opacity-40" : ""}`}
          >
            <Text
              tone={row === index ? "default" : "muted"}
              className={row === index ? "font-semibold" : ""}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
