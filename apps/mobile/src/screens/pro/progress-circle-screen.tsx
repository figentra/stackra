/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ProgressCircle` (@stackra-pro/ui): a ring with its value, the
 *          three sizes and a custom size, each `tone`, the indeterminate state, stroke widths and the disabled state.
 * Boundary: presentation only; the ring is @stackra-pro/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { ProgressCircle } from "@stackra-pro/ui/native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Value label",
    description: "`ProgressCircle.ValueLabel` centres the formatted value in the ring.",
    label: "Storage used",
  },
  sizes: {
    title: "Sizes",
    description: "`size` is a preset (`sm`, `md`, `lg`) or a number of pixels.",
    items: [
      { size: "sm", value: 40, label: "Small ring" },
      { size: "md", value: 60, label: "Medium ring" },
      { size: "lg", value: 80, label: "Large ring" },
      { size: 120, value: 72, label: "120 pixel ring" },
    ],
  },
  tones: {
    title: "Tones",
    description: "`tone` picks the colour role of the arc.",
    items: ["default", "accent", "success", "warning", "danger"],
  },
  indeterminate: {
    title: "Indeterminate",
    description:
      "`isIndeterminate` spins the ring while the amount is unknown; the value is hidden.",
    label: "Loading",
  },
  stroke: {
    title: "Stroke width",
    description: "`strokeWidth` on the indicator thins or thickens the ring.",
    items: [
      { width: 2, label: "Thin ring" },
      { width: 6, label: "Thick ring" },
    ],
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` lowers the opacity and marks the ring as disabled.",
    label: "Paused",
  },
} as const;

/** The ProgressCircle page: one section per size, tone and state, in a scrollable screen. */
export function ProgressCircleScreen() {
  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <ProgressCircle value={75} tone="success" size="lg" label={STRINGS.basic.label}>
          <ProgressCircle.Indicator />
          <ProgressCircle.ValueLabel />
        </ProgressCircle>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        <View className="flex-row flex-wrap items-center gap-4">
          {STRINGS.sizes.items.map(({ size, value, label }) => (
            <ProgressCircle key={label} value={value} size={size} label={label}>
              <ProgressCircle.Indicator />
            </ProgressCircle>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        <View className="flex-row flex-wrap items-center gap-4">
          {STRINGS.tones.items.map((tone) => (
            <ProgressCircle key={tone} value={60} tone={tone} label={tone}>
              <ProgressCircle.Indicator />
            </ProgressCircle>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.indeterminate.title} description={STRINGS.indeterminate.description}>
        <ProgressCircle isIndeterminate label={STRINGS.indeterminate.label}>
          <ProgressCircle.Indicator />
        </ProgressCircle>
      </Section>

      <Section title={STRINGS.stroke.title} description={STRINGS.stroke.description}>
        <View className="flex-row flex-wrap items-center gap-4">
          {STRINGS.stroke.items.map(({ width, label }) => (
            <ProgressCircle key={width} value={60} size="lg" label={label}>
              <ProgressCircle.Indicator strokeWidth={width} />
            </ProgressCircle>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <ProgressCircle value={60} isDisabled label={STRINGS.disabled.label}>
          <ProgressCircle.Indicator />
        </ProgressCircle>
      </Section>
    </Screen>
  );
}
