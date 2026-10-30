/**
 * Stackra file contract:
 * Purpose: the native `TocRail`: an "On this page" list of sections with a start-edge marker on the current one;
 *          pressing an entry calls `onSelect` (the screen scrolls its own list). `floating` puts it behind a round
 *          button at the bottom end, in a popover.
 * Boundary: native has no anchors or scroll spy: the screen passes `activeId` from its own scroll position.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); STA-1371.
 */
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#native/icon-button/icon-button";
import { Popover } from "#native/popover/popover";
import { Text } from "#native/text/text";
import type { TocRailProps } from "#native/toc-rail/toc-rail.props";

/** An "On this page" list. */
export function TocRail({
  items,
  activeId,
  onSelect,
  variant = "rail",
  label,
  className,
}: TocRailProps): ReactElement {
  const t = useUiText();
  const name = label ?? t(UI_KEYS.ui.toc_rail.label);
  const current = activeId ?? items[0]?.id;
  const list = (
    <View accessibilityLabel={name} className={["gap-2", className].filter(Boolean).join(" ")}>
      <Text type="caption" tone="muted" className="font-medium">
        {name}
      </Text>
      <View className="border-s border-separator">
        {items.map((item) => {
          const isCurrent = item.id === current;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect?.(item.id)}
              accessibilityRole="link"
              accessibilityState={{ selected: isCurrent }}
              className={[
                "-ms-px border-s-2 py-1.5 pe-2",
                item.level === 3 ? "ps-6" : "ps-3",
                isCurrent ? "border-accent" : "border-transparent",
              ].join(" ")}
            >
              <Text
                type="small"
                tone={isCurrent ? "default" : "muted"}
                className={isCurrent ? "font-medium" : ""}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
  if (variant === "rail") return list;
  return (
    <View className="absolute end-4 bottom-4">
      <Popover
        placement="top"
        align="end"
        trigger={<IconButton icon="list" label={t(UI_KEYS.ui.toc_rail.open)} variant="secondary" />}
      >
        <View className="w-64 p-1">{list}</View>
      </Popover>
    </View>
  );
}
