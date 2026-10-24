/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ProgressBar` (@stackra/ui): a bar at several values with its
 *          label and value shown, an indeterminate bar, each size and tone, a spoken value text and a custom range,
 *          and a live bar moved by buttons with a readout.
 * Boundary: presentation and local demo state only; the bar is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { Size, Tone } from "@stackra/ui/contracts";
import { Button, ProgressBar, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  values: {
    title: "Values",
    description:
      "`value` runs from 0 to 100 by default. `isLabelVisible` and `isValueVisible` draw the label and the percentage above the track.",
    label: (value: number) => `Upload at ${value} percent`,
  },
  indeterminate: {
    title: "Indeterminate",
    description: "Without a `value` the work is under way and its end is unknown.",
    label: "Preparing the export",
  },
  sizes: {
    title: "Sizes",
    description: "`size`: the thickness of the track.",
    label: (size: string) => `The ${size} bar`,
  },
  tones: {
    title: "Tones",
    description: "`tone`: the colour role of the fill.",
    label: (tone: string) => `The ${tone} tone`,
  },
  range: {
    title: "Spoken text and range",
    description:
      "`valueLabel` replaces the percentage, shown and spoken; `minValue` and `maxValue` set another range.",
    label: "Files uploaded",
    valueLabel: "3 of 12 files",
  },
  live: {
    title: "Try it",
    description: "Move the bar; the readout says the value a screen reader would hear.",
    label: "Download progress",
    more: "Add 10",
    less: "Take away 10",
    reset: "Reset",
    readout: (value: number) => `Progress: ${value} percent`,
  },
} as const;

/** The values of the first sample. */
const VALUES = [0, 35, 100] as const;

/** How far one press moves the live bar. */
const STEP = 10;

/** The ProgressBar page: one section per option, in a scrollable screen. */
export function ProgressBarScreen() {
  const [value, setValue] = useState(40);

  return (
    <Screen>
      <Section title={STRINGS.values.title} description={STRINGS.values.description}>
        {VALUES.map((current) => (
          <ProgressBar
            key={current}
            value={current}
            label={STRINGS.values.label(current)}
            isLabelVisible
            isValueVisible
          />
        ))}
      </Section>

      <Section title={STRINGS.indeterminate.title} description={STRINGS.indeterminate.description}>
        <ProgressBar label={STRINGS.indeterminate.label} isLabelVisible />
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        {Size.map((size) => (
          <ProgressBar key={size} value={60} size={size} label={STRINGS.sizes.label(size)} />
        ))}
      </Section>

      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        {Tone.map((tone) => (
          <ProgressBar key={tone} value={60} tone={tone} label={STRINGS.tones.label(tone)} />
        ))}
      </Section>

      <Section title={STRINGS.range.title} description={STRINGS.range.description}>
        <ProgressBar
          value={3}
          minValue={0}
          maxValue={12}
          label={STRINGS.range.label}
          valueLabel={STRINGS.range.valueLabel}
          isLabelVisible
          isValueVisible
        />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <ProgressBar value={value} label={STRINGS.live.label} isLabelVisible isValueVisible />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.readout(value)}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Button
            size="sm"
            isDisabled={value >= 100}
            onPress={() => setValue((current) => Math.min(100, current + STEP))}
          >
            {STRINGS.live.more}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={value <= 0}
            onPress={() => setValue((current) => Math.max(0, current - STEP))}
          >
            {STRINGS.live.less}
          </Button>
          <Button size="sm" variant="tertiary" onPress={() => setValue(0)}>
            {STRINGS.live.reset}
          </Button>
        </View>
      </Section>
    </Screen>
  );
}
