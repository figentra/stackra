/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ProgressBar` (@stackra/ui-pro): a labelled bar with its value,
 *          the three sizes, each `tone`, the indeterminate state, a custom range and the disabled state.
 * Boundary: presentation and local demo state only; the bar is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Button } from "@stackra/ui/native";
import { ProgressBar } from "@stackra/ui-pro/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Label and value",
    description: "A label row over the track; the buttons change the controlled value.",
    label: "Uploading",
    less: "Less",
    more: "More",
  },
  sizes: {
    title: "Sizes",
    description: "`size` sets the track height: `sm`, `md` and `lg`.",
    items: [
      { size: "sm", value: 40, label: "Small bar" },
      { size: "md", value: 60, label: "Medium bar" },
      { size: "lg", value: 80, label: "Large bar" },
    ],
  },
  tones: {
    title: "Tones",
    description: "`tone` picks the colour role of the fill.",
    items: ["default", "accent", "success", "warning", "danger"],
  },
  indeterminate: {
    title: "Indeterminate",
    description:
      "`isIndeterminate` sweeps a fill while the amount is unknown; the value is hidden.",
    label: "Loading",
  },
  range: {
    title: "Custom range",
    description: "`minValue` and `maxValue` change the scale: 3 of 5 steps.",
    label: "Setup steps",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` lowers the opacity and marks the bar as disabled.",
    label: "Paused upload",
  },
} as const;

/** The ProgressBar page: one section per size, tone and state, in a scrollable screen. */
export function ProgressBarScreen() {
  const [value, setValue] = useState(60);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <ProgressBar value={value} label={STRINGS.basic.label}>
          <View className="flex-row items-center justify-between">
            <ProgressBar.Label>{STRINGS.basic.label}</ProgressBar.Label>
            <ProgressBar.ValueLabel />
          </View>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <View className="flex-row gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onPress={() => setValue((current) => Math.max(0, current - 10))}
          >
            {STRINGS.basic.less}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onPress={() => setValue((current) => Math.min(100, current + 10))}
          >
            {STRINGS.basic.more}
          </Button>
        </View>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        {STRINGS.sizes.items.map(({ size, value: amount, label }) => (
          <ProgressBar key={size} value={amount} size={size} label={label}>
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        ))}
      </Section>

      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        {STRINGS.tones.items.map((tone) => (
          <ProgressBar key={tone} value={50} tone={tone} label={tone}>
            <View className="flex-row items-center justify-between">
              <ProgressBar.Label>{tone}</ProgressBar.Label>
              <ProgressBar.ValueLabel />
            </View>
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        ))}
      </Section>

      <Section title={STRINGS.indeterminate.title} description={STRINGS.indeterminate.description}>
        <ProgressBar isIndeterminate label={STRINGS.indeterminate.label}>
          <ProgressBar.Label>{STRINGS.indeterminate.label}</ProgressBar.Label>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </Section>

      <Section title={STRINGS.range.title} description={STRINGS.range.description}>
        <ProgressBar value={3} minValue={0} maxValue={5} label={STRINGS.range.label}>
          <View className="flex-row items-center justify-between">
            <ProgressBar.Label>{STRINGS.range.label}</ProgressBar.Label>
            <ProgressBar.ValueLabel />
          </View>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <ProgressBar value={60} isDisabled label={STRINGS.disabled.label}>
          <View className="flex-row items-center justify-between">
            <ProgressBar.Label>{STRINGS.disabled.label}</ProgressBar.Label>
            <ProgressBar.ValueLabel />
          </View>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </Section>
    </Screen>
  );
}
