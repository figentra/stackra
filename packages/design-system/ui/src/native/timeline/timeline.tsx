/**
 * Stackra file contract:
 * Purpose: the native `Timeline`: an activity feed. Each entry is a marker (an icon in a tone's disc, or a dot) on a
 *          line down the reading-start side, the actor and what they did, the time, and an optional body; the entries
 *          sit under day headings ("Today", "Yesterday", then the date). `compact` is one line per entry.
 * Boundary: each day heading is a header for VoiceOver and TalkBack; each entry is read as one element. Dates and
 *           times follow the provider's locale and digits; the line and markers mirror in right-to-left.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1; STA-1371.
 */
import { dateTimeFormatIn } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { use, useState, type ReactElement } from "react";
import { View } from "react-native";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { MARKER_TONE_CLASS_NAME } from "#core/constants/marker-tone-class-name.constant";
import { timelineDaysOf } from "#core/functions/timeline-days-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import { Text } from "#native/text/text";
import type { TimelineProps } from "#native/timeline/timeline.props";

/** The timeline's keys. */
const K = DISPLAY_KEYS.ui.timeline;

/** An activity feed grouped by day. */
export function Timeline({
  items,
  groupByDay = true,
  variant = "default",
  label,
  timeZone,
  now,
  className,
}: TimelineProps): ReactElement {
  const t = useUiText();
  const locale = use(DesignSystemContext)?.locale ?? "en";
  const numerals = useNumerals();
  const zone = timeZone ? { timeZone } : {};
  const time = dateTimeFormatIn(locale, { timeStyle: "short", ...zone }, numerals);
  const date = dateTimeFormatIn(locale, { dateStyle: "medium", ...zone }, numerals);
  const isCompact = variant === "compact";
  // The first render's moment, kept: "today" must not move between renders.
  const [mounted] = useState(() => new Date());
  const today = now ?? mounted;
  const days = groupByDay
    ? timelineDaysOf(items, today, timeZone)
    : [{ key: "all", daysAgo: Number.NaN, at: today, items }];
  const heading = (daysAgo: number, at: Date) =>
    daysAgo === 0 ? t(K.today) : daysAgo === 1 ? t(K.yesterday) : date.format(at);
  const disc = isCompact ? "size-6" : "size-8";
  return (
    <View
      accessibilityLabel={label ?? t(K.label)}
      className={`${isCompact ? "gap-3" : "gap-5"} ${className ?? ""}`}
    >
      {days.map((day) => (
        <View key={day.key} className="gap-2">
          {groupByDay ? (
            <Text type="small" tone="muted" accessibilityRole="header">
              {heading(day.daysAgo, day.at)}
            </Text>
          ) : null}
          {day.items.map((item, index) => {
            const at = new Date(item.at);
            const isLast = index === day.items.length - 1;
            return (
              <View key={item.id} accessible className="flex-row gap-3">
                <View className="items-center">
                  <View
                    className={`${disc} items-center justify-center rounded-full ${MARKER_TONE_CLASS_NAME[item.tone ?? "default"]}`}
                  >
                    {item.icon ? (
                      <SlotIcon icon={item.icon} />
                    ) : (
                      <View className="size-1.5 rounded-full bg-muted" />
                    )}
                  </View>
                  {isLast ? null : <View className="w-px flex-1 bg-muted/40" />}
                </View>
                <View className={`flex-1 gap-1 ${isLast ? "" : isCompact ? "pb-2" : "pb-5"}`}>
                  <View className="flex-row items-baseline gap-2">
                    <Text className="flex-1" numberOfLines={isCompact ? 1 : undefined}>
                      {item.actor ? (
                        <Text className="font-semibold">{`${item.actor} `}</Text>
                      ) : null}
                      {item.title}
                    </Text>
                    <Text type="small" tone="muted">
                      {time.format(at)}
                    </Text>
                  </View>
                  {!isCompact && item.body ? (
                    typeof item.body === "string" ? (
                      <Text type="small" tone="muted">
                        {item.body}
                      </Text>
                    ) : (
                      item.body
                    )
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
