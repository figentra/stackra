/**
 * Stackra file contract:
 * Purpose: the native `ToggleButtonGroup` on HeroUI Native Pro's ToggleButtonGroup (a group of toggle buttons with
 *          single or multiple selection): it maps `label` to `accessibilityLabel` and `isFullWidth` to `fullWidth`,
 *          and takes `size` and `isDisabled`; every other prop, `selectionMode`, `selectedKeys`,
 *          `onSelectionChange` and `orientation` included, passes through.
 * Boundary: no behaviour or styling of its own. It has no parts: its children are `ToggleButton`s, which carry
 *          an `id` the selection keys name. HeroUI Native Pro's `useToggleGroup` hook stays in
 *          `heroui-native-pro/toggle-button-group`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import { ToggleButtonGroup as HeroToggleButtonGroup } from "heroui-native-pro/toggle-button-group";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { ToggleButtonGroupProps } from "#native/toggle-button-group/toggle-button-group.props";

/**
 * A group of toggle buttons: `selectionMode` chooses single or multiple selection, and `selectedKeys` names the
 * selected buttons by their `id`. Name it for screen readers with `label`.
 */
export function ToggleButtonGroup({
  label,
  size,
  isDisabled,
  isFullWidth,
  ...rest
}: ToggleButtonGroupProps): ReactElement {
  return (
    <HeroToggleButtonGroup
      {...rest}
      {...omitUndefined({ size, isDisabled, fullWidth: isFullWidth, accessibilityLabel: label })}
    />
  );
}
