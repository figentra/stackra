/**
 * Stackra file contract:
 * Purpose: the native `PropertyList`, the adapted form of the web one: React Native has no description list, so it is a
 *          `View` with the `list` role holding a `listitem` View for each row, the label as muted small Text over the
 *          value, an empty value shown as the list's `emptyValue`, and a copy IconButton on a row that has a
 *          `copyLabel`, text to copy and a list `onCopy`. Every `View` prop passes through.
 * Boundary: built on the free View, Text and IconButton of this package; the only styling is the gaps between parts. A
 *           string or number value is wrapped in Text, any other node is drawn as given. There is no clipboard module
 *           in the free dependencies, so the list copies nothing itself: `onCopy` is where the app writes the
 *           clipboard (for example with `expo-clipboard`), which is why a row has no copy button without it; the list
 *           then announces `copiedLabel` ("Copied" by default) through the screen reader. `columns` is accepted and unread (ADR 0313 decision
 *           7): a phone shows one column.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0165 (HeroUI Native on native); ADR 0303 (decision
 *          7); ADR 0313 (decisions 1 and 7); WCAG 2.2 SC 1.3.1 and 2.5.8.
 */
import type { ReactElement, ReactNode } from "react";
import { AccessibilityInfo, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { PropertyListItem } from "#contracts/types/property-list-item.type";
import { copyTextOf } from "#core/functions/copy-text-of.function";
import { IconButton } from "#native/icon-button/icon-button";
import { Text } from "#native/text/text";
import type { PropertyListProps } from "#native/property-list/property-list.props";

/** True for a value with nothing to show: missing, empty or `false`; `0` is a value. */
const isEmpty = (value: ReactNode) => value == null || value === "" || value === false;

/** Label and value pairs, one column, with an optional copy button on each row. */
export function PropertyList<TItem extends PropertyListItem = PropertyListItem>({
  items,
  columns: _columns,
  emptyValue = "–",
  copiedLabel: copiedLabelProp,
  onCopy,
  className,
  ...rest
}: PropertyListProps<TItem>): ReactElement {
  const t = useUiText();
  const copiedLabel = copiedLabelProp ?? t(UI_KEYS.ui.property_list.copied);
  return (
    <View role="list" className={["gap-4", className].filter(Boolean).join(" ")} {...rest}>
      {items.map((item) => {
        const text = copyTextOf(item);
        return (
          <View key={item.id} role="listitem" className="gap-1">
            <Text type="small" tone="muted">
              {item.label}
            </Text>
            <View className="flex-row items-center gap-1">
              <View className="shrink">
                {isEmpty(item.value) ? (
                  <Text tone="muted">{emptyValue}</Text>
                ) : typeof item.value === "string" || typeof item.value === "number" ? (
                  <Text>{item.value}</Text>
                ) : (
                  item.value
                )}
              </View>
              {onCopy === undefined || text === undefined || item.copyLabel === undefined ? null : (
                <IconButton
                  icon="copy"
                  label={item.copyLabel}
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    onCopy(item, text);
                    AccessibilityInfo.announceForAccessibility(copiedLabel);
                  }}
                />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
