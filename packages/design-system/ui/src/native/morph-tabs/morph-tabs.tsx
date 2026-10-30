/**
 * Stackra file contract:
 * Purpose: the native `MorphTabs`: a row of icon tabs where the chosen one grows into a soft accent pill that shows its
 *          words, the others shrinking back to their icon (Reanimated layout transitions, the words fading in); a tab
 *          list to VoiceOver and TalkBack, every tab named by its label, each change playing the selection haptic.
 * Boundary: no panels: the app shows what the chosen key stands for. The row follows the reading direction. Reduced
 *           motion snaps the sizes.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { cn, useThemeColor } from "heroui-native";
import { LucideProvider } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, LinearTransition, ReduceMotion } from "react-native-reanimated";
import type { ReactElement } from "react";

import { haptics } from "#native/haptics/haptics";
import type { MorphTabsProps } from "#native/morph-tabs/morph-tabs.props";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import { Text } from "#native/text/text";

const BASE = motionTiming(STACKRA_THEME, "base");
const LAYOUT = LinearTransition.duration(BASE.durationMs).reduceMotion(ReduceMotion.System);

/** Icon tabs whose chosen tab grows into a pill with its words. */
export function MorphTabs({
  items,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  label,
  isDisabled = false,
  className,
  ...rest
}: MorphTabsProps): ReactElement {
  const [ownKey, setOwnKey] = useState(defaultSelectedKey ?? items[0]?.id);
  const selected = selectedKey ?? ownKey;
  const [accent, muted] = useThemeColor(["accent-soft-foreground", "muted"]);

  const choose = (key: string) => {
    if (key === selected) return;
    haptics.play("selection");
    setOwnKey(key);
    onSelectionChange?.(key);
  };

  return (
    <View
      {...rest}
      accessibilityRole="tablist"
      accessibilityLabel={label}
      className={cn("flex-row items-center gap-1", isDisabled && "opacity-50", className) ?? ""}
    >
      {items.map((item) => {
        const isSelected = item.id === selected;
        const isRefused = isDisabled || item.isDisabled === true;
        return (
          <Animated.View key={item.id} layout={LAYOUT}>
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isSelected, disabled: isRefused }}
              disabled={isRefused}
              onPress={() => choose(item.id)}
              className={
                cn(
                  "h-10 flex-row items-center gap-1.5 rounded-full px-3",
                  isSelected && "bg-accent-soft",
                ) ?? ""
              }
            >
              <LucideProvider color={isSelected ? accent : muted} size={20}>
                <SlotIcon icon={item.icon} />
              </LucideProvider>
              {isSelected ? (
                <Animated.View
                  entering={FadeIn.duration(BASE.durationMs).reduceMotion(ReduceMotion.System)}
                >
                  <Text tone="accent" className="font-medium" numberOfLines={1}>
                    {item.label}
                  </Text>
                </Animated.View>
              ) : null}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}
