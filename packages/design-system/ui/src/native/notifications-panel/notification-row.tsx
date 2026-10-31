/**
 * Stackra file contract:
 * Purpose: the native `NotificationRow`: one notification: the tone's icon, the title (bold while unread), the detail
 *          and time, an accent unread dot that names itself to screen readers, a pressable body when the panel takes
 *          presses, and, when it takes dismisses, a close button plus a horizontal swipe (either way, so it mirrors
 *          by itself in Arabic) that slides the row out past a third of its width and springs back short of it.
 * Boundary: internal to the NotificationsPanel. The swipe is React Native's PanResponder driving a Reanimated value
 *           (this package has no gesture-handler dependency); it claims only clearly horizontal drags, so the sheet's
 *           pan-down still works. The close button is the accessible path. Reduced motion dismisses without the slide.
 * Runtime: react-native
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 2.5.1
 *          (a single-pointer alternative to the swipe).
 */
import { motionSpring, motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useThemeColor } from "heroui-native";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { PanResponder, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { CloseButton } from "#native/close-button/close-button";
import { FeedbackIcon } from "#native/feedback-icon/feedback-icon";
import { Text } from "#native/text/text";
import type { NotificationRowProps } from "#native/notifications-panel/notification-row.props";

/** How far a drag must go before it is a swipe, in points, and the share of the width that dismisses. */
const SLOP = 12;
const DISMISS_SHARE = 1 / 3;
/** How long the row takes to slide out, in ms: the theme's fast step. */
const EXIT_MS = motionTiming(STACKRA_THEME, "fast").durationMs;
/** The spring a released row settles back on. */
const SNAPPY = motionSpring(STACKRA_THEME, "snappy");
/** The unread dot, in points. */
const DOT = 8;

/** One notification in the panel's list. */
export function NotificationRow({
  item,
  onPress,
  onDismiss,
  dismissLabel,
  unreadLabel,
}: NotificationRowProps): ReactElement {
  const accent = useThemeColor("accent");
  const isReduced = useReducedMotion();
  const offset = useSharedValue(0);
  const width = useSharedValue(360);
  const [isLeaving, setLeaving] = useState(false);
  // The slide-out plays on the UI thread; the panel hears of the dismiss once it is over.
  useEffect(() => {
    if (!isLeaving || !onDismiss) return undefined;
    const timer = setTimeout(() => onDismiss(item.id), EXIT_MS);
    return () => clearTimeout(timer);
  }, [isLeaving, onDismiss, item.id]);

  const responder = useMemo(() => {
    if (!onDismiss) return undefined;
    const settle = () => {
      offset.set(isReduced ? 0 : withSpring(0, SNAPPY));
    };
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) > SLOP && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderMove: (_event, gesture) => {
        offset.set(gesture.dx);
      },
      onPanResponderRelease: (_event, gesture) => {
        if (Math.abs(gesture.dx) < width.get() * DISMISS_SHARE) return settle();
        if (isReduced) return onDismiss(item.id);
        offset.set(withTiming(Math.sign(gesture.dx) * width.get(), { duration: EXIT_MS }));
        setLeaving(true);
        return undefined;
      },
      onPanResponderTerminate: settle,
    });
  }, [onDismiss, item.id, isReduced, offset, width]);

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
    opacity: 1 - Math.min(Math.abs(offset.get()) / Math.max(width.get(), 1), 1) * 0.6,
  }));

  const body = (
    <>
      <View className="mt-0.5">
        <FeedbackIcon tone={item.tone ?? "default"} icon={item.icon} />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className={item.isUnread ? "font-semibold" : "font-normal"}>{item.title}</Text>
        {item.description == null ? null : (
          <Text type="small" tone="muted">
            {item.description}
          </Text>
        )}
        {item.time == null ? null : (
          <Text type="caption" tone="muted">
            {item.time}
          </Text>
        )}
      </View>
      {item.isUnread ? (
        <View
          accessible
          accessibilityLabel={unreadLabel}
          style={{
            width: DOT,
            height: DOT,
            borderRadius: DOT / 2,
            backgroundColor: accent,
            marginTop: 6,
          }}
        />
      ) : null}
    </>
  );
  const layout = "min-w-0 flex-1 flex-row items-start gap-3 py-2";

  return (
    <Animated.View
      {...(responder?.panHandlers ?? {})}
      onLayout={(event) => {
        width.set(event.nativeEvent.layout.width);
      }}
      style={swipeStyle}
      className="flex-row items-start gap-1"
    >
      {onPress ? (
        <Pressable accessibilityRole="button" className={layout} onPress={() => onPress(item.id)}>
          {body}
        </Pressable>
      ) : (
        <View className={layout}>{body}</View>
      )}
      {onDismiss ? <CloseButton label={dismissLabel} onPress={() => onDismiss(item.id)} /> : null}
    </Animated.View>
  );
}
