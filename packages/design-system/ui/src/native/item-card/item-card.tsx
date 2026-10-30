/**
 * Stackra file contract:
 * Purpose: the native `ItemCard`: one row-like card (an icon in a soft tile, the title, a muted line, an end slot);
 *          with `onPress` it is a button with a chevron that points to the inline end (mirrored in right-to-left).
 * Boundary: a pressable card is read as a button named by its title, the line as its hint. Inside an ItemCardGroup it
 *           drops its own frame.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0060; WCAG 2.2
 *          SC 4.1.2.
 */
import { use, type ReactElement } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "#native/icon/icon";
import { ItemCardGroupContext } from "#native/item-card/item-card-group-context";
import { Text } from "#native/text/text";
import type { ItemCardProps } from "#native/item-card/item-card.props";

/** One card. */
export function ItemCard({
  title,
  description,
  icon,
  end,
  onPress,
  isDisabled,
  className,
}: ItemCardProps): ReactElement {
  const isGrouped = use(ItemCardGroupContext);
  const look = `min-h-14 flex-row items-center gap-3 px-4 py-3 ${isGrouped ? "" : "rounded-2xl border border-border bg-surface"} ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`;
  const body = (
    <>
      {icon ? (
        <View className="size-9 items-center justify-center rounded-xl bg-default">
          <Icon name={icon} size="sm" />
        </View>
      ) : null}
      <View className="flex-1 gap-0.5">
        <Text className="font-medium" isTruncated>
          {title}
        </Text>
        {description ? (
          <Text type="small" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {end == null ? null : typeof end === "string" ? (
        <Text type="small" tone="muted">
          {end}
        </Text>
      ) : (
        end
      )}
      {onPress ? <Icon name="chevron-right" size="sm" tone="muted" /> : null}
    </>
  );
  if (!onPress) return <View className={look}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      disabled={Boolean(isDisabled)}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ disabled: Boolean(isDisabled) }}
      className={`${look} active:bg-default`}
    >
      {body}
    </Pressable>
  );
}
