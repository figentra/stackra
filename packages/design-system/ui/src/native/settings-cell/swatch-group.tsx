/**
 * Stackra file contract:
 * Purpose: `SwatchGroup`, a wrapping row of round colour swatches of which one is picked, shared by the native
 *          SettingsColorCell and ColorPicker.
 * Boundary: internal; each swatch is a radio read by its hex code, 36pt with 8pt gaps; the picked one carries a ring
 *           and a dot in the colour's readable contrast. A selection haptic on each choice.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 1.4.11, 4.1.2.
 */
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import { haptics } from "#native/haptics/haptics";

/** True when black reads better than white on `hex`. */
const isLight = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
  return (r ?? 0) * 0.299 + (g ?? 0) * 0.587 + (b ?? 0) * 0.114 > 160;
};

/** A row of swatches. */
export function SwatchGroup({
  swatches,
  value,
  onChange,
  label,
  isDisabled,
}: {
  readonly swatches: readonly string[];
  readonly value: string | null;
  readonly onChange: (hex: string) => void;
  readonly label: string;
  readonly isDisabled?: boolean | undefined;
}): ReactElement {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="flex-row flex-wrap gap-2"
    >
      {swatches.map((hex) => (
        <Pressable
          key={hex}
          disabled={Boolean(isDisabled)}
          accessibilityRole="radio"
          accessibilityLabel={hex}
          accessibilityState={{ checked: hex === value, disabled: Boolean(isDisabled) }}
          onPress={() => {
            haptics.play("selection");
            onChange(hex);
          }}
          className={`size-9 items-center justify-center rounded-[var(--radius-pill)] border ${hex === value ? "border-2 border-accent" : "border-border"}`}
          style={{ backgroundColor: hex }}
        >
          {hex === value ? (
            <View
              className="size-3 rounded-[var(--radius-pill)]"
              style={{ backgroundColor: isLight(hex) ? "#000000" : "#ffffff" }}
            />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
