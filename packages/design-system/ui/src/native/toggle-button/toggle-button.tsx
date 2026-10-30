/**
 * Stackra file contract:
 * Purpose: the native `ToggleButton`, missing from HeroUI Native: the Stackra Button drawn `tertiary` (or `ghost`) while
 *          up and `secondary` (the soft accent) while pressed, a toggle button to VoiceOver and TalkBack with its
 *          checked state. Alone it holds its own state (or `isSelected`); inside a ToggleButtonGroup the group's.
 * Boundary: builds on `#native/button/button` (its press haptic included); the props mirror React Aria's, which the web
 *           re-export of HeroUI's ToggleButton takes. An icon-only button needs `label`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decisions 3 and 5: parity, adapted form); wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import { cn } from "heroui-native";
import { useContext, useState } from "react";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Button } from "#native/button/button";
import { ToggleButtonGroupContext } from "#native/toggle-button-group/toggle-button-group-context";
import type { ToggleButtonProps } from "#native/toggle-button/toggle-button.props";

/** A button that stays pressed or not. */
export function ToggleButton({
  id,
  children,
  isSelected,
  defaultSelected,
  onChange,
  variant = "default",
  size,
  isIconOnly = false,
  isDisabled = false,
  className,
  ...rest
}: ToggleButtonProps): ReactElement {
  const group = useContext(ToggleButtonGroupContext);
  const [ownSelected, setOwnSelected] = useState(defaultSelected ?? false);
  const inGroup = group !== undefined && id !== undefined;
  const pressed = inGroup ? group.selected.has(id) : (isSelected ?? ownSelected);
  const refused = isDisabled || (group?.isDisabled ?? false);
  const drawnSize = size ?? group?.size;

  return (
    <Button
      {...rest}
      variant={pressed ? "secondary" : variant === "ghost" ? "ghost" : "tertiary"}
      isDisabled={refused}
      accessibilityRole="togglebutton"
      accessibilityState={{ checked: pressed }}
      {...omitUndefined({
        className: cn(isIconOnly && "aspect-square px-0", className) || undefined,
      })}
      {...(drawnSize === undefined ? {} : { size: drawnSize })}
      onPress={() => {
        if (inGroup) group.toggle(id);
        else setOwnSelected(!pressed);
        onChange?.(!pressed);
      }}
    >
      {children}
    </Button>
  );
}
