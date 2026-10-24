/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `NumberPad` (@stackra/ui-pro): the default keypad as a PIN
 *          entry with a maximum length and a completion message, a hand-composed keypad whose spacer is a decimal
 *          key, and the disabled state.
 * Boundary: presentation and local demo state only; the keypad is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Heading, Text } from "@stackra/ui/native";
import { NumberPad } from "@stackra/ui-pro/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  pin: {
    title: "PIN entry",
    description:
      "The default 3 by 4 keypad, capped at four digits; a long press on delete clears everything.",
    name: "PIN keypad",
    value: "PIN:",
    complete: "PIN complete.",
    incomplete: "Enter four digits.",
  },
  amount: {
    title: "Decimal key",
    description:
      "Composed by hand: the spacer cell holds a decimal point, wired through `onSpacerPress`.",
    name: "Amount keypad",
    value: "Amount:",
    decimal: "Decimal point",
    placeholder: "0",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` turns off every key.",
    name: "Keypad, unavailable",
  },
  deleteKey: "Delete",
} as const;

/** The digit rows of the hand-composed keypad; the last row is written out because it holds the spacer. */
const DIGIT_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
] as const;

/** The NumberPad page: one section per layout and state, in a scrollable screen. */
export function NumberPadScreen() {
  const [pin, setPin] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [amount, setAmount] = useState("");

  return (
    <Screen>
      <Section title={STRINGS.pin.title} description={STRINGS.pin.description}>
        <Heading level={3} accessibilityLiveRegion="polite">
          {`${STRINGS.pin.value} ${pin.padEnd(4, "•")}`}
        </Heading>
        <NumberPad
          label={STRINGS.pin.name}
          value={pin}
          maxLength={4}
          onValueChange={(next) => {
            setPin(next);
            setIsComplete(false);
          }}
          onComplete={() => setIsComplete(true)}
        />
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {isComplete ? STRINGS.pin.complete : STRINGS.pin.incomplete}
        </Text>
      </Section>

      <Section title={STRINGS.amount.title} description={STRINGS.amount.description}>
        <Heading level={3} accessibilityLiveRegion="polite">
          {`${STRINGS.amount.value} ${amount === "" ? STRINGS.amount.placeholder : amount}`}
        </Heading>
        <NumberPad
          label={STRINGS.amount.name}
          value={amount}
          onValueChange={setAmount}
          onSpacerPress={() =>
            setAmount((current) =>
              current.includes(".") ? current : `${current === "" ? "0" : current}.`,
            )
          }
        >
          {DIGIT_ROWS.map((row) => (
            <NumberPad.Row key={row.join("")}>
              {row.map((digit) => (
                <NumberPad.Key key={digit} value={digit} />
              ))}
            </NumberPad.Row>
          ))}
          <NumberPad.Row>
            <NumberPad.Spacer accessibilityLabel={STRINGS.amount.decimal}>
              <NumberPad.KeyLabel>.</NumberPad.KeyLabel>
            </NumberPad.Spacer>
            <NumberPad.Key value="0" />
            <NumberPad.Backspace accessibilityLabel={STRINGS.deleteKey} />
          </NumberPad.Row>
        </NumberPad>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <NumberPad label={STRINGS.disabled.name} defaultValue="1234" isDisabled />
      </Section>
    </Screen>
  );
}
