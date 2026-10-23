/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `WheelPicker` (@stackra/ui-pro): a controlled year wheel with
 *          the chosen value read back, a wheel with a mask and taller rows, a wheel with a custom row, and the
 *          disabled state.
 * Boundary: presentation and local demo state only; the wheel is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { WheelPicker } from "@stackra/ui-pro/native";
import { Typography } from "heroui-native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  controlled: {
    title: "Controlled",
    description:
      "Scroll or tap a row to select it; with no children the wheel draws its own selection band.",
    name: "Birth year",
    value: "Selected:",
  },
  mask: {
    title: "Mask and row height",
    description:
      "`WheelPicker.Mask` fades the top and bottom rows; `itemHeight` and `visibleCount` size the wheel.",
    name: "Appointment slot",
  },
  custom: {
    title: "Custom row",
    description: "`renderItem` draws each row; the selected row is bold.",
    name: "Reminder type",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` blocks scrolling and keeps the current row.",
    name: "Locked year",
  },
} as const;

const FIRST_YEAR = 1950;
const YEAR_ITEMS = Array.from({ length: 70 }, (_, index) => ({
  value: FIRST_YEAR + index,
  label: String(FIRST_YEAR + index),
}));

const SLOT_ITEMS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30"].map(
  (slot) => ({ value: slot, label: slot }),
);

const REMINDER_ITEMS = [
  { value: "notification", label: "Notification" },
  { value: "email", label: "Email" },
  { value: "text", label: "Text message" },
  { value: "call", label: "Phone call" },
];

/** The WheelPicker page: one section per option and state, in a scrollable screen. */
export function WheelPickerScreen() {
  const [year, setYear] = useState(1995);

  return (
    <Screen>
      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <WheelPicker
          label={STRINGS.controlled.name}
          items={YEAR_ITEMS}
          value={year}
          onValueChange={setYear}
        />
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.value} ${year}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.mask.title} description={STRINGS.mask.description}>
        <WheelPicker
          label={STRINGS.mask.name}
          items={SLOT_ITEMS}
          defaultValue="10:00"
          itemHeight={56}
          visibleCount={5}
        >
          <WheelPicker.Indicator />
          <WheelPicker.Mask />
        </WheelPicker>
      </Section>

      <Section title={STRINGS.custom.title} description={STRINGS.custom.description}>
        <WheelPicker
          label={STRINGS.custom.name}
          items={REMINDER_ITEMS}
          defaultValue="email"
          renderItem={({ item, isSelected }) => (
            <WheelPicker.Item>
              <WheelPicker.ItemLabel className={isSelected ? "font-semibold" : "font-normal"}>
                {item.label}
              </WheelPicker.ItemLabel>
            </WheelPicker.Item>
          )}
        >
          <WheelPicker.Indicator />
          <WheelPicker.Mask />
        </WheelPicker>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <WheelPicker
          label={STRINGS.disabled.name}
          items={YEAR_ITEMS}
          defaultValue={2000}
          isDisabled
        />
      </Section>
    </Screen>
  );
}
