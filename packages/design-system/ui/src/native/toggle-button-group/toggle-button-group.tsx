/**
 * Stackra file contract:
 * Purpose: the native `ToggleButtonGroup`, missing from HeroUI Native: a row (or column) of ToggleButtons where one
 *          (`single`) or several (`multiple`) stay pressed, controlled by `selectedKeys` or holding its own, joined a
 *          hairline apart or spaced with `isDetached`; a group to VoiceOver and TalkBack.
 * Boundary: the buttons read the state through `ToggleButtonGroupContext`; the props mirror React Aria's, which the web
 *           re-export of HeroUI's ToggleButtonGroup takes. The row follows the reading direction.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decisions 3 and 5); wave 3c mobile interactions (owner approval 2026-10-28).
 */
import { cn } from "heroui-native";
import { useMemo, useState } from "react";
import { View } from "react-native";
import type { ReactElement } from "react";

import { ToggleButtonGroupContext } from "#native/toggle-button-group/toggle-button-group-context";
import type { ToggleButtonGroupProps } from "#native/toggle-button-group/toggle-button-group.props";

/** A group of toggle buttons with single or multiple selection. */
export function ToggleButtonGroup({
  children,
  selectionMode = "single",
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  disallowEmptySelection = false,
  orientation = "horizontal",
  size,
  isDetached = false,
  isDisabled = false,
  className,
  ...rest
}: ToggleButtonGroupProps): ReactElement {
  const [ownKeys, setOwnKeys] = useState<ReadonlySet<string>>(new Set(defaultSelectedKeys ?? []));
  const selected = useMemo(
    () => (selectedKeys === undefined ? ownKeys : new Set(selectedKeys)),
    [selectedKeys, ownKeys],
  );
  const value = useMemo(
    () => ({
      selected,
      size,
      isDisabled,
      toggle: (id: string) => {
        const next = new Set(selectionMode === "single" ? [] : selected);
        if (selected.has(id)) {
          if (disallowEmptySelection && selected.size === 1) return;
          next.delete(id);
        } else next.add(id);
        setOwnKeys(next);
        onSelectionChange?.(next);
      },
    }),
    [selected, size, isDisabled, selectionMode, disallowEmptySelection, onSelectionChange],
  );

  return (
    <ToggleButtonGroupContext value={value}>
      <View
        {...rest}
        accessibilityRole={selectionMode === "single" ? "radiogroup" : "toolbar"}
        className={
          cn(
            orientation === "vertical" ? "flex-col" : "flex-row",
            isDetached ? "gap-2" : "gap-0.5",
            "self-start",
            className,
          ) ?? ""
        }
      >
        {children}
      </View>
    </ToggleButtonGroupContext>
  );
}
