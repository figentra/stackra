/**
 * Stackra file contract:
 * Purpose: the native `NativeSelect`: the Select contract drawn with the platform's own chooser: the iOS action sheet
 *          (`ActionSheetIOS`) on iOS, and the house Select as a dialog elsewhere (Android's own list dialog look).
 * Boundary: on iOS the field is a read-only Input that opens the sheet with a Cancel button; disabled and read-only
 *           refuse. A choice plays a selection haptic.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055; WCAG 2.2
 *          SC 4.1.2.
 */
import { Description, FieldError, Input, Label, TextField as HeroTextField } from "heroui-native";
import { useState, type ReactElement } from "react";
import { ActionSheetIOS, Platform, Pressable, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { Select } from "#native/select/select";
import type { NativeSelectProps } from "#native/native-select/native-select.props";

/** A select drawn by the platform. */
export function NativeSelect(props: NativeSelectProps): ReactElement {
  const t = useUiText();
  const {
    items,
    label,
    description,
    errorMessage,
    placeholder,
    isFullWidth = true,
    isRequired,
    isInvalid,
    isDisabled,
    isReadOnly,
    value,
    defaultValue,
    onChange,
    accessibilityLabel,
    className,
  } = props;
  const [own, setOwn] = useState(defaultValue ?? null);
  if (Platform.OS !== "ios") {
    const { accessibilityLabel: _a, name: _n, ...rest } = props;
    return (
      <Select
        {...omitUndefined(rest)}
        items={items}
        presentation="dialog"
        {...(accessibilityLabel ? { accessibilityLabel } : {})}
      />
    );
  }
  const key = value === undefined ? own : value;
  const chosen = items.find((item) => item.id === key);
  const enabled = items.filter((item) => !item.isDisabled);
  const open = () =>
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...enabled.map((item) => item.label), t(UI_KEYS.ui.date_field.cancel)],
        cancelButtonIndex: enabled.length,
        ...(typeof label === "string" ? { title: label } : {}),
      },
      (index) => {
        const item = enabled[index];
        if (!item) return;
        haptics.play("selection");
        if (value === undefined) setOwn(item.id);
        onChange?.(item.id);
      },
    );
  const isLocked = Boolean(isDisabled || isReadOnly);
  return (
    <HeroTextField
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      className={[isFullWidth ? "" : "self-start", className].filter(Boolean).join(" ")}
    >
      {label == null ? null : <Label>{label}</Label>}
      <Pressable
        disabled={Boolean(isDisabled)}
        onPress={() => (isLocked ? undefined : open())}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (typeof label === "string" ? label : undefined)}
        accessibilityValue={{ text: chosen?.label ?? placeholder ?? "" }}
      >
        <View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          className="justify-center"
        >
          <Input value={chosen?.label ?? ""} placeholder={placeholder ?? ""} editable={false} />
          <View className="absolute end-3">
            <Icon name="chevron-down" size="sm" tone="muted" />
          </View>
        </View>
      </Pressable>
      {description == null ? null : <Description hideOnInvalid>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}
