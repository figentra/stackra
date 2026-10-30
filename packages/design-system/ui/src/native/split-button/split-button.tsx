/**
 * Stackra file contract:
 * Purpose: the native `SplitButton`: a row of the primary `Button` and an `IconButton` caret that opens a `Menu` of
 *          related actions, two buttons a hairline apart as on Android's split button, keeping their theme radii; the row
 *          follows the reading direction, so the caret sits at the reading end in RTL.
 *          The caret turns half a circle with Reanimated while the menu is open (the theme's `fast` step, at once under
 *          reduced motion); both halves play the light press haptic of every Button.
 * Boundary: builds on `#native/button/button`, `#native/icon-button/icon-button` and `#native/menu/menu`; the row is
 *           grouped for VoiceOver and TalkBack only through its two named buttons.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0329 (motion layer); design-system gap inventory row 34.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Button } from "#native/button/button";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { Menu } from "#native/menu/menu";
import type { SplitButtonProps } from "#native/split-button/split-button.props";

const FAST = motionTiming(STACKRA_THEME, "fast");

/** A primary action with a caret that opens its related actions, for example "Save" with "Save and new". */
export function SplitButton({
  children,
  onPress,
  startIcon,
  menuLabel,
  sections,
  onAction,
  variant = "primary",
  size,
  isDisabled,
  isLoading,
  placement = "bottom",
  align = "end",
  isOpen,
  defaultOpen,
  onOpenChange,
  className,
  ...rest
}: SplitButtonProps): ReactElement {
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const open = isOpen ?? ownOpen;
  const isReduced = useReducedMotion();
  const turn = useSharedValue(open ? 180 : 0);
  useEffect(() => {
    const to = open ? 180 : 0;
    turn.set(isReduced ? to : withTiming(to, { duration: FAST.durationMs }));
  }, [open, isReduced, turn]);
  const caretStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));

  return (
    <View
      {...rest}
      className={["flex-row items-center gap-0.5", className].filter(Boolean).join(" ")}
    >
      <Button
        variant={variant}
        {...omitUndefined({ size, isDisabled, isLoading, onPress, startIcon })}
      >
        {children}
      </Button>
      <Menu
        sections={sections}
        placement={placement}
        align={align}
        {...omitUndefined({ isOpen, defaultOpen, onAction })}
        onOpenChange={(next) => {
          setOwnOpen(next);
          onOpenChange?.(next);
        }}
      >
        <IconButton
          label={menuLabel}
          variant={variant}
          isDisabled={isDisabled === true || isLoading === true}
          icon={
            <Animated.View style={caretStyle}>
              <Icon name="chevron-down" />
            </Animated.View>
          }
          {...omitUndefined({ size })}
        />
      </Menu>
    </View>
  );
}
