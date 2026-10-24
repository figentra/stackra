/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `StackedMeter` (@stackra/ui-pro): a labelled meter with its
 *          legend, the three sizes, status colours, a fixed capacity with raw values, and the disabled state.
 * Boundary: presentation and demo data only; the meter is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { StackedMeter, type StackedMeterProps } from "@stackra/ui-pro/native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Label, track and legend",
    description:
      "Segments without a colour take the chart colours in order; values show as shares.",
    label: "Languages",
  },
  sizes: {
    title: "Sizes",
    description: "`size` sets the track height: `sm`, `md` and `lg`.",
    items: [
      { size: "sm", label: "Small meter" },
      { size: "md", label: "Medium meter" },
      { size: "lg", label: "Large meter" },
    ],
  },
  colors: {
    title: "Status colours",
    description:
      "A segment's `color` picks a status colour; the legend repeats it with the name and value.",
    label: "Tasks",
  },
  capacity: {
    title: "Capacity",
    description:
      "`maxValue` measures the segments against a fixed total; the unused part stays empty.",
    label: "Storage",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` lowers the opacity and marks the meter as disabled.",
    label: "Languages, disabled",
  },
} as const;

const LANGUAGES = [
  { id: "ts", label: "TypeScript", value: 96.3 },
  { id: "css", label: "CSS", value: 2.6 },
  { id: "js", label: "JavaScript", value: 1.1 },
];

const TASKS: StackedMeterProps["segments"] = [
  { id: "done", label: "Done", value: 12, color: "success" },
  { id: "review", label: "In review", value: 5, color: "warning" },
  { id: "blocked", label: "Blocked", value: 2, color: "danger" },
];

const STORAGE = [
  { id: "photos", label: "Photos", value: 42 },
  { id: "apps", label: "Apps", value: 28 },
  { id: "system", label: "System", value: 12 },
];

/** The StackedMeter page: one section per layout and state, in a scrollable screen. */
export function StackedMeterScreen() {
  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <StackedMeter segments={LANGUAGES} label={STRINGS.basic.label}>
          <StackedMeter.Label>{STRINGS.basic.label}</StackedMeter.Label>
          <StackedMeter.Track />
          <StackedMeter.Legend />
        </StackedMeter>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        {STRINGS.sizes.items.map(({ size, label }) => (
          <StackedMeter key={size} segments={LANGUAGES} size={size} label={label}>
            <StackedMeter.Track />
          </StackedMeter>
        ))}
      </Section>

      <Section title={STRINGS.colors.title} description={STRINGS.colors.description}>
        <StackedMeter segments={TASKS} label={STRINGS.colors.label}>
          <StackedMeter.Label>{STRINGS.colors.label}</StackedMeter.Label>
          <StackedMeter.Track />
          <StackedMeter.Legend />
        </StackedMeter>
      </Section>

      <Section title={STRINGS.capacity.title} description={STRINGS.capacity.description}>
        <StackedMeter
          segments={STORAGE}
          maxValue={128}
          label={STRINGS.capacity.label}
          formatOptions={{ style: "unit", unit: "gigabyte", maximumFractionDigits: 1 }}
        >
          <StackedMeter.Label>{STRINGS.capacity.label}</StackedMeter.Label>
          <StackedMeter.Track />
          <StackedMeter.Legend />
        </StackedMeter>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <StackedMeter segments={LANGUAGES} label={STRINGS.disabled.label} isDisabled>
          <StackedMeter.Label>{STRINGS.disabled.label}</StackedMeter.Label>
          <StackedMeter.Track />
          <StackedMeter.Legend />
        </StackedMeter>
      </Section>
    </Screen>
  );
}
