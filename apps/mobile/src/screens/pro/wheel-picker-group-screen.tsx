/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `WheelPickerGroup` (@stackra/ui-pro): two wheels sharing one
 *          selection band and one values record with the chosen pair read back, a group that reports only when every
 *          wheel has come to rest, taller shared rows, and the disabled state.
 * Boundary: presentation and local demo state only; the group is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Text } from "@stackra/ui/native";
import { WheelPicker, WheelPickerGroup } from "@stackra/ui-pro/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  controlled: {
    title: "Controlled values",
    description:
      "One record, keyed by each wheel's `name`, holds the pair; one band spans both wheels.",
    name: "Transfer amount",
    currency: "Currency",
    amount: "Amount",
    value: "Selected:",
  },
  commit: {
    title: "Commit on rest",
    description: "`onValuesCommit` fires once, after both wheels have stopped.",
    name: "Exchange amount",
    value: "Committed:",
    none: "nothing yet",
  },
  height: {
    title: "Shared row height",
    description: "`itemHeight` and `visibleCount` are set on the group and apply to every wheel.",
    name: "Preferred amount",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` blocks every wheel in the group.",
    name: "Locked amount",
  },
} as const;

const CURRENCY_ITEMS = ["USD", "EUR", "GBP", "JPY", "CAD"].map((code) => ({
  value: code,
  label: code,
}));

const AMOUNT_ITEMS = [50, 100, 200, 500, 1000, 2500, 5000].map((amount) => ({
  value: amount,
  label: String(amount),
}));

/** The two wheels of the demo group, as one fragment so every section shows the same pair. */
function CurrencyWheels() {
  return (
    <>
      <WheelPicker name="currency" items={CURRENCY_ITEMS} />
      <WheelPicker name="amount" items={AMOUNT_ITEMS} />
      <WheelPickerGroup.Indicator />
      <WheelPickerGroup.Mask />
    </>
  );
}

/** The WheelPickerGroup page: one section per option and state, in a scrollable screen. */
export function WheelPickerGroupScreen() {
  const [values, setValues] = useState<Record<string, unknown>>({ currency: "USD", amount: 500 });
  const [committed, setCommitted] = useState<Record<string, unknown> | null>(null);

  return (
    <Screen>
      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <WheelPickerGroup
          label={STRINGS.controlled.name}
          values={values}
          onValuesChange={setValues}
        >
          <CurrencyWheels />
        </WheelPickerGroup>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.value} ${String(values.amount)} ${String(values.currency)}`}
        </Text>
      </Section>

      <Section title={STRINGS.commit.title} description={STRINGS.commit.description}>
        <WheelPickerGroup
          label={STRINGS.commit.name}
          defaultValues={{ currency: "EUR", amount: 100 }}
          onValuesCommit={setCommitted}
        >
          <CurrencyWheels />
        </WheelPickerGroup>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.commit.value} ${
            committed
              ? `${String(committed.amount)} ${String(committed.currency)}`
              : STRINGS.commit.none
          }`}
        </Text>
      </Section>

      <Section title={STRINGS.height.title} description={STRINGS.height.description}>
        <WheelPickerGroup
          label={STRINGS.height.name}
          defaultValues={{ currency: "GBP", amount: 200 }}
          itemHeight={56}
          visibleCount={3}
        >
          <CurrencyWheels />
        </WheelPickerGroup>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <WheelPickerGroup
          label={STRINGS.disabled.name}
          defaultValues={{ currency: "USD", amount: 100 }}
          isDisabled
        >
          <CurrencyWheels />
        </WheelPickerGroup>
      </Section>
    </Screen>
  );
}
