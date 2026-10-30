/**
 * Stackra file contract:
 * Purpose: the native `SettingsCell`: one setting as a row (an icon tile, the title, a muted line) with its control at
 *          the inline end and, when given, content under it at full width. The family members fill the control.
 * Boundary: drawing only; each control names itself by the title. In an ItemCardGroup it drops its frame.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import { use, type ReactElement } from "react";
import { View } from "react-native";

import { Icon } from "#native/icon/icon";
import { ItemCardGroupContext } from "#native/item-card/item-card-group-context";
import { Text } from "#native/text/text";
import type { SettingsCellProps } from "#native/settings-cell/settings-cell.props";

/** Draws one setting row with its title and control. */
export function SettingsCell({
  title,
  description,
  icon,
  control,
  children,
  isDisabled,
  className,
}: SettingsCellProps): ReactElement {
  const isGrouped = use(ItemCardGroupContext);
  return (
    <View
      className={`gap-3 px-4 py-3 ${isGrouped ? "" : "rounded-[var(--radius-container)] border border-border bg-surface"} ${isDisabled ? "opacity-60" : ""} ${className ?? ""}`}
    >
      <View className="min-h-8 flex-row items-center gap-3">
        {icon ? (
          <View className="size-8 items-center justify-center rounded-[var(--radius-control)] bg-default">
            <Icon name={icon} size="sm" />
          </View>
        ) : null}
        <View
          className="flex-1 gap-0.5"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Text className="font-medium">{title}</Text>
          {description ? (
            <Text type="small" tone="muted">
              {description}
            </Text>
          ) : null}
        </View>
        {control}
      </View>
      {children}
    </View>
  );
}
