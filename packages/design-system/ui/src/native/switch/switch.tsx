/**
 * Stackra file contract:
 * Purpose: the native `Switch` on HeroUI Native's ControlField and Switch: maps the shared field contract (`value` to
 *          `isSelected`, `onChange` with the new state, `defaultValue` held in state because HeroUI Native's field is
 *          controlled only) and draws the label, description and error message with the switch at the row's end in one
 *          pressable row; every other ControlField prop passes through.
 * Boundary: no styling of its own beyond the row's layout and the switch's state colours (an edged muted track and a
 *          muted thumb when off, the accent when on). Documented adaptations, where HeroUI Native has no
 *          equivalent: `isReadOnly` refuses the press (React Native has no read-only state to announce); `name` is
 *          accepted for a form adapter but native has no form to submit. The row is the one accessible `switch` and
 *          the inner control is hidden from VoiceOver and TalkBack, so it is not read twice.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0303 (decision 7); ADR 0055
 *          (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import {
  ControlField,
  Description,
  FieldError,
  Label,
  Switch as HeroSwitch,
  useThemeColor,
} from "heroui-native";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { THEME_PX } from "#core/constants/theme-px.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { haptics } from "#native/haptics/haptics";
import type { SwitchProps } from "#native/switch/switch.props";

/**
 * A toggle for a setting that takes effect at once, in a row that is pressable end to end. `label` names it;
 * `description` and `errorMessage` sit under the label and are read out with it.
 */
export function Switch({
  label,
  description,
  errorMessage,
  value,
  defaultValue = false,
  onChange,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  name,
  className,
  accessibilityState,
  ...rest
}: SwitchProps): ReactElement {
  const [held, setHeld] = useState(defaultValue);
  // Off is HeroUI Native's muted `default` track edged in the field border (3:1 on the page in both schemes) with a
  // `muted` thumb; on is the accent track with the `accent-foreground` thumb. The thumb's fill tells them apart, so the
  // state never rests on its position: in right to left the off thumb rests at the right, where English puts on.
  const [track, edge, accent, thumbOff, thumbOn] = useThemeColor([
    "default",
    "field-border",
    "accent",
    "muted",
    "accent-foreground",
  ] as const);
  const isSelected = value ?? held;
  // The name only keys a web form's submission and a form adapter's binding; there is nothing to submit on native.
  void name;
  const change = (next: boolean) => {
    if (isReadOnly) return;
    haptics.play("selection");
    setHeld(next);
    onChange?.(next);
  };
  return (
    <ControlField
      {...rest}
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      // oxlint-disable-next-line jsx-a11y/role-has-required-aria-props -- reason: React Native reports the checked state through accessibilityState
      role="switch"
      accessibilityState={{
        ...accessibilityState,
        checked: isSelected,
        disabled: isDisabled === true,
      }}
      isSelected={isSelected}
      onSelectedChange={change}
      className={["flex-col items-start gap-1", className].filter(Boolean).join(" ")}
    >
      <View className="w-full flex-row items-center gap-3">
        <View className="flex-1">
          {label ? <Label>{label}</Label> : null}
          {description ? <Description>{description}</Description> : null}
        </View>
        <ControlField.Indicator
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          // The row takes every press, so the switch and the row always agree on what the next state is.
          pointerEvents="none"
        >
          <HeroSwitch
            animation={{ backgroundColor: { value: [track, accent] } }}
            style={{ borderWidth: THEME_PX.borderWidth, borderColor: isSelected ? accent : edge }}
          >
            <HeroSwitch.Thumb animation={{ backgroundColor: { value: [thumbOff, thumbOn] } }} />
          </HeroSwitch>
        </ControlField.Indicator>
      </View>
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </ControlField>
  );
}
