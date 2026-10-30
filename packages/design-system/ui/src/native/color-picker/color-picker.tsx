/**
 * Stackra file contract:
 * Purpose: the native `ColorPicker`: the house swatches and a hex field beside a preview, editing one `#rrggbb`.
 * Boundary: no saturation area on native yet (a gesture-driven canvas is a follow-up); the hex field takes `#rgb` or
 *           `#rrggbb` (`hexColorOf`) and ignores anything else until it is valid. The hex is written left to right.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { COLOR_SWATCHES } from "#core/constants/color-swatches.constant";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { hexColorOf } from "#core/functions/hex-color-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { SwatchGroup } from "#native/settings-cell/swatch-group";
import { Text } from "#native/text/text";
import { TextField } from "#native/text-field/text-field";
import type { ColorPickerProps } from "#native/color-picker/color-picker.props";

/** A colour from swatches or typed. */
export function ColorPicker({
  label,
  description,
  value,
  defaultValue,
  onChange,
  swatches = COLOR_SWATCHES,
  isDisabled,
  className,
}: ColorPickerProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.color_picker;
  const [own, setOwn] = useState(defaultValue ?? swatches[0] ?? "#000000");
  const hex = value ?? own;
  const [typed, setTyped] = useState<string | null>(null);
  const set = (next: string) => {
    setTyped(null);
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  return (
    <View className={`gap-3 ${className ?? ""}`}>
      {label == null ? null : <Text className="font-medium">{label}</Text>}
      <SwatchGroup
        label={typeof label === "string" ? label : t(K.swatches)}
        swatches={swatches}
        value={hex}
        onChange={set}
        isDisabled={isDisabled}
      />
      <View className="flex-row items-end gap-2">
        <View
          className="size-11 rounded-xl border border-border"
          style={{ backgroundColor: hex }}
        />
        <View className="flex-1" style={{ direction: "ltr" }}>
          <TextField
            label={t(K.hex)}
            value={typed ?? hex}
            autoCapitalize="none"
            autoCorrect={false}
            onChange={(text) => {
              const parsed = hexColorOf(text);
              if (parsed) set(parsed);
              else setTyped(text);
            }}
            {...(isDisabled ? { isDisabled } : {})}
          />
        </View>
      </View>
      {description == null ? null : (
        <Text type="small" tone="muted">
          {description}
        </Text>
      )}
    </View>
  );
}
