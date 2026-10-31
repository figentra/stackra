/**
 * Stackra file contract:
 * Purpose: the native `ItemCardGroup`: ItemCards or SettingsCells joined into one rounded surface with hairline
 *          separators, under an optional heading and over an optional footnote (the iOS grouped-list look).
 * Boundary: drawing only; the heading is a header to VoiceOver and TalkBack.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import { Children, type ReactElement } from "react";
import { View } from "react-native";

import { ItemCardGroupContext } from "#native/item-card/item-card-group-context";
import { Text } from "#native/text/text";
import type { ItemCardGroupProps } from "#native/item-card/item-card-group.props";

/** Cards joined into one surface. */
export function ItemCardGroup({
  title,
  description,
  children,
  className,
}: ItemCardGroupProps): ReactElement {
  return (
    <View className={`gap-2 ${className ?? ""}`}>
      {title ? (
        <Text type="small" tone="muted" accessibilityRole="header" className="px-4">
          {title}
        </Text>
      ) : null}
      <ItemCardGroupContext value>
        <View className="overflow-hidden rounded-[var(--radius-container)] border border-border bg-surface">
          {Children.toArray(children).map((child, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- the wrapped children have no identity but their place in the group
            <View key={index} className={index > 0 ? "border-t border-separator" : ""}>
              {child}
            </View>
          ))}
        </View>
      </ItemCardGroupContext>
      {description ? (
        <Text type="small" tone="muted" className="px-4">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
