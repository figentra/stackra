/**
 * Stackra file contract:
 * Purpose: the native `AvatarGroup`: up to `max` Stackra Avatars stacked with a background-coloured seam, then a "+N"
 *          count avatar in the locale's digits. A press fans the avatars apart (a Reanimated spring of their
 *          inline-start margin) with a light haptic, and a second press stacks them again. VoiceOver and TalkBack read
 *          it as one image: the label, then the names and how many more.
 * Boundary: `marginStart` follows the layout direction, so the stack mirrors in right-to-left. Reduced motion moves at
 *           once. Each avatar is decorative; the group carries the name.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; design-system gap inventory row 25.
 */
import { useState } from "react";
import { Pressable } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { listFormatOf } from "#core/functions/list-format-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Avatar } from "#native/avatar/avatar";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { haptics } from "#native/haptics/haptics";
import type { AvatarGroupProps } from "#native/avatar-group/avatar-group.props";

/** How far each avatar tucks under the one before it, by size, in points: HeroUI's 0.5rem scaled. */
const OVERLAP = Object.freeze({ sm: 8, md: 10, lg: 14 } as const);

/** The gap between fanned-out avatars, in points. */
const FANNED_GAP = 4;

/** The seam that separates stacked avatars. */
const SEAM = "border-2 border-background";

/** Stacked people (assignees, staff on shift) with a count for those that do not fit; press to fan them out. */
export function AvatarGroup({
  items,
  max = 4,
  label,
  size = "md",
  tone,
  variant,
  shape,
  ...rest
}: AvatarGroupProps): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const isReduced = useReducedMotion();
  const [isFanned, setIsFanned] = useState(false);
  const spread = useSharedValue(0);
  const tuck = useAnimatedStyle(() => ({
    marginStart: interpolate(spread.get(), [0, 1], [-OVERLAP[size], FANNED_GAP]),
  }));

  const shown = items.slice(0, Math.max(0, max));
  const remaining = items.length - shown.length;
  const names = shown.map((item) => item.name);
  if (remaining > 0) names.push(t(UI_KEYS.ui.avatar_group.more_label, { count: remaining }));
  // shortcut: a comma join where Hermes lacks Intl.ListFormat; drop the fallback once every engine has it.
  const list =
    typeof Intl.ListFormat === "function"
      ? listFormatOf(locale, { type: "conjunction" }).format(names)
      : names.join(", ");
  const shared = {
    size,
    ...(tone ? { tone } : {}),
    ...(variant ? { variant } : {}),
    ...(shape ? { shape } : {}),
  };

  const toggle = () => {
    haptics.play("light");
    const next = isFanned ? 0 : 1;
    setIsFanned(!isFanned);
    spread.set(isReduced ? next : withSpring(next));
  };

  return (
    <Pressable
      {...rest}
      onPress={toggle}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t(UI_KEYS.ui.avatar_group.summary, { label, names: list })}
      className="flex-row items-center"
    >
      {shown.map((item, index) => (
        <Animated.View key={item.id} style={index === 0 ? undefined : tuck}>
          <Avatar
            {...shared}
            name={item.name}
            className={SEAM}
            {...(item.src ? { src: item.src } : {})}
          />
        </Animated.View>
      ))}
      {remaining > 0 ? (
        <Animated.View style={shown.length === 0 ? undefined : tuck}>
          <Avatar
            {...shared}
            className={SEAM}
            fallback={t(UI_KEYS.ui.avatar_group.more, { count: remaining })}
          />
        </Animated.View>
      ) : null}
    </Pressable>
  );
}
