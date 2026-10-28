/**
 * Stackra file contract:
 * Purpose: the native `ListItem` on HeroUI Native's ListGroup parts: one row with a start icon or avatar (the prefix),
 *          a title and description (the content), end content, and a chevron (the suffix, whose default is HeroUI
 *          Native's own chevron, mirrored for right-to-left). A row with `onPress` is a button; one without is plain
 *          content, drawn the same but never announced as pressable.
 * Boundary: no styling of its own beyond a minimum height of 44 points and the dimmed look of a disabled pressable row. It belongs inside
 *           a `ListGroup`, which `List` provides. A string or number `endContent` is wrapped in the description text,
 *           because React Native refuses a bare string outside a `Text`. The props of HeroUI Native's `ListGroup.Item`
 *           (a `Pressable`) pass through, so `List` sets the radio or checkbox role and the checked state through them.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (text slots); ADR 0165 (HeroUI Native on
 *          native); WCAG 2.2 SC 2.5.8 (target size).
 */
import type { ReactElement } from "react";
import { ListGroup } from "heroui-native";
import { View } from "react-native";

import { SlotIcon } from "#native/slot-icon/slot-icon";
import type { ListItemProps } from "#native/list/list-item.props";
import { endContentNode } from "#native/list/end-content-node.function";

/** A row of a list. Pressable with `onPress`; a disabled pressable row refuses the press, is dimmed and is announced disabled, and a plain row is never dimmed. */
export function ListItem({
  title,
  description,
  startIcon,
  endContent,
  hasChevron,
  onPress,
  isDisabled,
  label,
  className,
  ...rest
}: ListItemProps): ReactElement {
  const isPressable = onPress !== undefined;
  const classes = ["min-h-11", isDisabled && isPressable ? "opacity-50" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <ListGroup.Item
      {...(isPressable ? { accessibilityRole: "button" as const } : {})}
      {...(label === undefined ? {} : { accessibilityLabel: label })}
      {...rest}
      className={classes}
      // `Pressable` writes `disabled` into the accessibility state itself and keeps the caller's other flags (checked).
      disabled={isDisabled === true}
      {...(isPressable ? { onPress } : {})}
    >
      {startIcon === undefined ? null : (
        <ListGroup.ItemPrefix>
          <SlotIcon icon={startIcon} />
        </ListGroup.ItemPrefix>
      )}
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        {description === undefined || description === null ? null : (
          <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription>
        )}
      </ListGroup.ItemContent>
      {endContent === undefined || endContent === null ? null : (
        <View className="flex-row items-center gap-2">{endContentNode(endContent)}</View>
      )}
      {hasChevron === true ? <ListGroup.ItemSuffix /> : null}
    </ListGroup.Item>
  );
}
