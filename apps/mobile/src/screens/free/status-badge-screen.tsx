/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `StatusBadge` (@stackra/ui): every tone in every size, the
 *          status column of a list of orders, and a live badge that steps through an order's states.
 * Boundary: presentation and local demo state only; the badge is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Enum, Tone } from "@stackra/contracts";
import { Size } from "@stackra/ui/contracts";
import { Button, Separator, StatusBadge, Text } from "@stackra/ui/native";
import { Fragment, useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  tones: {
    title: "Tones and sizes",
    description: "One row per size, one badge per tone, each with a state that fits it.",
    size: (size: string) => `Size ${size}`,
  },
  records: {
    title: "In a list",
    description: "The status column of a list of records.",
  },
  live: {
    title: "Try it",
    description:
      "Move the order to its next state. The badge changes on screen; nothing is announced, so a page that must announce a change uses a toast.",
    advance: "Next state",
  },
  states: {
    default: "Draft",
    accent: "Scheduled",
    success: "Active",
    warning: "Pending",
    danger: "Failed",
  } satisfies Record<Tone, string>,
} as const;

/** The orders of the list sample: a name and the tone of its state. */
const ORDERS = [
  { name: "Order 1040", tone: "success" },
  { name: "Order 1041", tone: "warning" },
  { name: "Order 1042", tone: "danger" },
  { name: "Order 1043", tone: "default" },
] as const;

/** The StatusBadge page: one section per option, in a scrollable screen. */
export function StatusBadgeScreen() {
  const [step, setStep] = useState(0);
  const tone = Enum.values(Tone)[step % Enum.values(Tone).length] ?? "default";

  return (
    <Screen>
      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        {Size.map((size) => (
          <Sample key={size} caption={STRINGS.tones.size(size)}>
            <View className="flex-row flex-wrap gap-2">
              {Enum.values(Tone).map((badgeTone) => (
                <StatusBadge key={badgeTone} tone={badgeTone} size={size}>
                  {STRINGS.states[badgeTone]}
                </StatusBadge>
              ))}
            </View>
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.records.title} description={STRINGS.records.description}>
        <View className="gap-3">
          {ORDERS.map((order, index) => (
            <Fragment key={order.name}>
              {index > 0 ? <Separator /> : null}
              <View className="flex-row items-center justify-between">
                <Text>{order.name}</Text>
                <StatusBadge tone={order.tone} size="sm">
                  {STRINGS.states[order.tone]}
                </StatusBadge>
              </View>
            </Fragment>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <View className="flex-row items-center gap-3">
          <Button size="sm" variant="secondary" onPress={() => setStep((value) => value + 1)}>
            {STRINGS.live.advance}
          </Button>
          <StatusBadge tone={tone}>{STRINGS.states[tone]}</StatusBadge>
        </View>
      </Section>
    </Screen>
  );
}
