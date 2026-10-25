/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ProgressCircle` (@stackra/ui): a ring at several values, an
 *          indeterminate ring, each size and tone, a spoken value text, and a live ring moved by buttons with a
 *          readout of the value, which the ring itself only speaks.
 * Boundary: presentation and local demo state only; the ring is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { Size, Tone } from "@stackra/ui/contracts";
import { Button, ProgressCircle, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  values: {
    title: "Values",
    description:
      "`value` runs from 0 to 100 by default; the ring draws no text, it is named and spoken.",
    caption: (value: number) => `${value} percent`,
    label: (value: number) => `Sync at ${value} percent`,
  },
  indeterminate: {
    title: "Indeterminate",
    description:
      "Without a `value` the arc turns, because the work is under way and its end is unknown.",
    caption: "No value",
    label: "Syncing your photos",
  },
  sizes: {
    title: "Sizes",
    description: "`size`: the diameter of the ring.",
    label: (size: string) => `The ${size} ring`,
  },
  tones: {
    title: "Tones",
    description: "`tone`: the colour role of the arc.",
    label: (tone: string) => `The ${tone} tone`,
  },
  spoken: {
    title: "Spoken text",
    description: "`valueLabel` replaces the percentage a screen reader says.",
    caption: "Says “7 of 10 steps”",
    label: "Setup steps done",
    valueLabel: "7 of 10 steps",
  },
  live: {
    title: "Try it",
    description: "Move the ring; the readout shows the value, which the ring only speaks.",
    label: "Backup progress",
    more: "Add 10",
    less: "Take away 10",
    reset: "Reset",
    readout: (value: number) => `Progress: ${value} percent`,
  },
} as const;

/** The values of the first sample. */
const VALUES = [0, 25, 50, 75, 100] as const;

/** How far one press moves the live ring. */
const STEP = 10;

/** One row of rings that wraps onto the next line. */
const ROW = "flex-row flex-wrap items-end gap-6";

/** The ProgressCircle page: one section per option, in a scrollable screen. */
export function ProgressCircleScreen() {
  const [value, setValue] = useState(40);

  return (
    <Screen>
      <Section title={STRINGS.values.title} description={STRINGS.values.description}>
        <View className={ROW}>
          {VALUES.map((current) => (
            <Sample key={current} caption={STRINGS.values.caption(current)}>
              <ProgressCircle value={current} label={STRINGS.values.label(current)} />
            </Sample>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.indeterminate.title} description={STRINGS.indeterminate.description}>
        <Sample caption={STRINGS.indeterminate.caption}>
          <ProgressCircle label={STRINGS.indeterminate.label} />
        </Sample>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        <View className={ROW}>
          {Size.map((size) => (
            <Sample key={size} caption={size}>
              <ProgressCircle value={60} size={size} label={STRINGS.sizes.label(size)} />
            </Sample>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        <View className={ROW}>
          {Tone.map((tone) => (
            <Sample key={tone} caption={tone}>
              <ProgressCircle value={60} tone={tone} label={STRINGS.tones.label(tone)} />
            </Sample>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.spoken.title} description={STRINGS.spoken.description}>
        <Sample caption={STRINGS.spoken.caption}>
          <ProgressCircle
            value={7}
            minValue={0}
            maxValue={10}
            label={STRINGS.spoken.label}
            valueLabel={STRINGS.spoken.valueLabel}
          />
        </Sample>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <ProgressCircle value={value} size="lg" label={STRINGS.live.label} />
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
