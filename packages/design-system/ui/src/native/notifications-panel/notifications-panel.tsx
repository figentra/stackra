/**
 * Stackra file contract:
 * Purpose: the native `NotificationsPanel`: a header bell `IconButton` with the unread count on a `Badge`, opening a
 *          `Drawer` (the bottom sheet) that lists the notifications under their group headings, with mark-all-read,
 *          per-row press, close and swipe to dismiss, an empty state and a footer. When the unread count rises the
 *          bell wiggles and bumps on the UI thread and a notification haptic plays; reduced motion keeps the haptic
 *          and drops the movement. `isInline` shows the same panel in place, as a `Card` under its heading.
 * Boundary: the caller owns the items and their read state. The bump scales the bell with its badge: the badge hangs
 *           off the anchor's corner, so wrapping it alone would move it off its anchor. Default words come from `ui`.
 * Runtime: react-native
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312.
 */
import { useNumerals } from "@stackra/i18n/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { Bell } from "@stackra/icons/native/lucide-icons";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { badgeCountOf } from "#core/functions/badge-count-of.function";
import { groupNotifications } from "#core/functions/group-notifications.function";
import { Badge } from "#native/badge/badge";
import { Button } from "#native/button/button";
import { Card } from "#native/card/card";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Drawer } from "#native/drawer/drawer";
import { useHaptic } from "#native/haptics/use-haptic";
import { IconButton } from "#native/icon-button/icon-button";
import { NotificationRow } from "#native/notifications-panel/notification-row";
import type { NotificationsPanelProps } from "#native/notifications-panel/notifications-panel.props";
import { Text } from "#native/text/text";
import { useUiText } from "#react/hooks/use-ui-text";

/** One swing of the wiggle, in ms, and its angles in degrees. */
const SWING_MS = motionTiming(STACKRA_THEME, "instant").durationMs;
/** Each half of the bump, in ms: the theme's fast step. */
const BUMP_MS = motionTiming(STACKRA_THEME, "fast").durationMs;
const SWINGS = [-14, 12, -8, 4, 0] as const;

/** A bell that opens the viewer's notifications, grouped, with their unread state. */
export function NotificationsPanel({
  items,
  onItemPress,
  onDismiss,
  onMarkAllRead,
  label,
  title,
  emptyState,
  footer,
  isInline = false,
  isOpen,
  defaultOpen,
  onOpenChange,
}: NotificationsPanelProps): ReactElement {
  const t = useUiText();
  const K = UI_KEYS.ui.notifications_panel;
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const { play } = useHaptic();
  const isReduced = useReducedMotion();
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const open = isOpen ?? ownOpen;
  const setOpen = (next: boolean) => {
    if (isOpen === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  const unread = items.filter((item) => item.isUnread).length;
  const previous = useRef(unread);
  const angle = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const hasArrived = unread > previous.current;
    previous.current = unread;
    if (!hasArrived) return;
    play("success");
    if (isReduced) return;
    angle.set(
      withSequence(...SWINGS.map((degrees) => withTiming(degrees, { duration: SWING_MS }))),
    );
    scale.set(
      withSequence(withTiming(1.15, { duration: BUMP_MS }), withTiming(1, { duration: BUMP_MS })),
    );
  }, [unread, isReduced, play, angle, scale]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.get()}deg` }, { scale: scale.get() }],
  }));

  const count = badgeCountOf(unread, locale, numerals);
  const groups = groupNotifications(items);

  const body = (
    <>
      {onMarkAllRead && unread > 0 ? (
        <View className="flex-row justify-end">
          <Button variant="ghost" size="sm" onPress={onMarkAllRead}>
            {t(K.mark_all_read)}
          </Button>
        </View>
      ) : null}
      {items.length === 0 ? (
        <View className="py-6">
          {typeof emptyState === "string" || emptyState == null ? (
            <Text tone="muted" align="center">
              {emptyState ?? t(K.empty)}
            </Text>
          ) : (
            emptyState
          )}
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 420 }}>
          {groups.map((group, index) => (
            <View key={group.heading ?? `none-${index}`}>
              {group.heading === undefined ? null : (
                <Text type="caption" tone="muted" accessibilityRole="header" className="pt-2">
                  {group.heading}
                </Text>
              )}
              {group.items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onPress={onItemPress}
                  onDismiss={onDismiss}
                  dismissLabel={t(K.dismiss)}
                  unreadLabel={t(K.unread)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
      {footer == null ? null : <View className="border-t border-border pt-2">{footer}</View>}
    </>
  );

  if (isInline)
    return (
      <Card>
        <Card.Header>
          <Card.Title>{title ?? t(K.title)}</Card.Title>
        </Card.Header>
        <Card.Content>{body}</Card.Content>
      </Card>
    );

  return (
    <>
      <Animated.View style={bellStyle}>
        <Badge.Anchor>
          <IconButton
            variant="ghost"
            label={label ?? (unread > 0 ? t(K.label_unread, { count: unread }) : t(K.label))}
            icon={<Bell size={20} />}
            onPress={() => setOpen(true)}
          />
          {count === "" ? null : (
            <Badge tone="danger" size="sm">
              {count}
            </Badge>
          )}
        </Badge.Anchor>
      </Animated.View>
      <Drawer isOpen={open} onOpenChange={setOpen}>
        <Drawer.Header>
          <Drawer.Title>{title ?? t(K.title)}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>{body}</Drawer.Body>
      </Drawer>
    </>
  );
}
