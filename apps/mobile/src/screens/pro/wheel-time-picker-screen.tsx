/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `WheelTimePicker` (@stackra/ui-pro): a controlled hour and
 *          minute wheel with the chosen time read back, a 24-hour wheel, a wheel with a minute step, a wheel that
 *          reports only when it comes to rest, and the disabled state, in the locale the display switcher chose.
 * Boundary: presentation and local demo state only; the wheel is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Time } from "@internationalized/date";
import { useDesignSystem } from "@stackra/ui/native";
import { WheelTimePicker } from "@stackra/ui-pro/native";
import { Typography } from "heroui-native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  controlled: {
    title: "Controlled",
    description: "Hour, minute and an AM/PM column, in the locale's day-period labels.",
    name: "Alarm time",
    value: "Selected:",
  },
  twentyFour: {
    title: "24-hour",
    description: "`hourFormat={24}` gives hours 0 to 23 and no AM/PM column.",
    name: "Shift start time",
  },
  interval: {
    title: "Minute step",
    description: "`minuteInterval={15}` offers 00, 15, 30 and 45.",
    name: "Appointment time",
  },
  commit: {
    title: "Commit on rest",
    description: "`onValueCommit` fires once, after every column has stopped.",
    name: "Departure time",
    value: "Committed:",
    none: "nothing yet",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` blocks every column.",
    name: "Cutoff time",
  },
} as const;

/** The WheelTimePicker page: one section per option and state, in a scrollable screen. */
export function WheelTimePickerScreen() {
  const { locale } = useDesignSystem();
  const [time, setTime] = useState(() => new Time(9, 30));
  const [committed, setCommitted] = useState<Time | null>(null);

  return (
    <Screen>
      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <WheelTimePicker
          label={STRINGS.controlled.name}
          locale={locale}
          value={time}
          onValueChange={setTime}
        />
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.value} ${time.toString()}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.twentyFour.title} description={STRINGS.twentyFour.description}>
        <WheelTimePicker
          label={STRINGS.twentyFour.name}
          hourFormat={24}
          defaultValue={new Time(14, 0)}
        />
      </Section>

      <Section title={STRINGS.interval.title} description={STRINGS.interval.description}>
        <WheelTimePicker
          label={STRINGS.interval.name}
          locale={locale}
          minuteInterval={15}
          defaultValue={new Time(10, 15)}
        />
      </Section>

      <Section title={STRINGS.commit.title} description={STRINGS.commit.description}>
        <WheelTimePicker label={STRINGS.commit.name} locale={locale} onValueCommit={setCommitted} />
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.commit.value} ${committed?.toString() ?? STRINGS.commit.none}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <WheelTimePicker label={STRINGS.disabled.name} locale={locale} isDisabled />
      </Section>
    </Screen>
  );
}
