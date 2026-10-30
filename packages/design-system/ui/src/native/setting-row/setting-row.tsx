/**
 * Stackra file contract:
 * Purpose: the native `SettingRow`, an options tile: an icon at the inline start, then the house Switch row (title,
 *          description and the switch at the inline end, one accessible `switch` that plays its selection haptic), or
 *          the title, description and the caller's `action`; while the switch is on, `detail` fades in under the row
 *          on react-native-reanimated with the theme's `base` step.
 * Boundary: no styling of its own beyond the row layout; `flex-row` follows the layout direction, so the row mirrors
 *           in right-to-left. The system's reduce-motion setting opens the detail at once.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); ADR 0060 (right-to-left);
 *          WCAG 2.2 SC 2.3.3, 4.1.2; design-system gap inventory row 37.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut, ReduceMotion } from "react-native-reanimated";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import { Switch } from "#native/switch/switch";
import { Text } from "#native/text/text";
import type { SettingRowProps } from "#native/setting-row/setting-row.props";

const BASE = motionTiming(STACKRA_THEME, "base");
const OPEN = FadeIn.duration(BASE.durationMs).reduceMotion(ReduceMotion.System);
const CLOSE = FadeOut.duration(BASE.durationMs).reduceMotion(ReduceMotion.System);

/** One setting: its words, its switch or action, and the detail that opens while it is on. */
export function SettingRow({
  title,
  description,
  icon,
  value,
  defaultValue,
  onChange,
  isDisabled,
  action,
  detail,
  className,
  ...rest
}: SettingRowProps): ReactElement {
  const [held, setHeld] = useState(defaultValue ?? false);
  const isOn = value ?? held;
  const hasSwitch = value !== undefined || defaultValue !== undefined || onChange !== undefined;
  const change = (next: boolean) => {
    setHeld(next);
    onChange?.(next);
  };

  return (
    <View {...rest} className={`gap-3 py-3 ${className ?? ""}`}>
      <View className="flex-row items-center gap-3">
        {icon ? (
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <SlotIcon icon={icon} />
          </View>
        ) : null}
        {hasSwitch ? (
          <Switch
            className="flex-1"
            label={title}
            description={description}
            value={isOn}
            onChange={change}
            {...omitUndefined({ isDisabled })}
          />
        ) : (
          <>
            <View className="flex-1 gap-0.5">
              <Text className="font-medium">{title}</Text>
              {description ? (
                <Text type="small" tone="muted">
                  {description}
                </Text>
              ) : null}
            </View>
            {action}
          </>
        )}
      </View>
      {detail && isOn ? (
        <Animated.View entering={OPEN} exiting={CLOSE}>
          {detail}
        </Animated.View>
      ) : null}
    </View>
  );
}
