/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `RadioButtonGroup` (@stackra/ui-pro): card-style radio items
 *          side by side with the chosen value read back, a stacked list with labels and descriptions in the
 *          secondary variant, one item disabled, and the whole group disabled.
 * Boundary: presentation and local demo state only; the group is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Description, Label, Text } from "@stackra/ui/native";
import { RadioButtonGroup } from "@stackra/ui-pro/native";
import { Radio } from "heroui-native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  cards: {
    title: "Side-by-side cards",
    description: "A row of items; the picked one carries the selected style and the radio.",
    name: "Billing period",
    value: "Selected:",
    quarterly: { title: "Quarterly", note: "Billed every 3 months" },
    monthly: { title: "Monthly", note: "Billed every month" },
  },
  list: {
    title: "Secondary variant with descriptions",
    description:
      '`variant="secondary"` gives each row a surface; the yearly plan is disabled on its own.',
    name: "Plan",
    starter: { title: "Starter", note: "One workspace, ten seats." },
    team: { title: "Team", note: "Unlimited workspaces, fifty seats." },
    yearly: { title: "Enterprise", note: "Contact sales to unlock this plan." },
  },
  disabled: {
    title: "Disabled group",
    description: "`isDisabled` on the group stops every item.",
    name: "Delivery speed",
    standard: { title: "Standard", note: "3 to 5 days" },
    express: { title: "Express", note: "Next day" },
  },
} as const;

/** The RadioButtonGroup page: one section per layout and state, in a scrollable screen. */
export function RadioButtonGroupScreen() {
  const [period, setPeriod] = useState("quarterly");
  const [plan, setPlan] = useState("starter");
  const [speed, setSpeed] = useState("standard");

  return (
    <Screen>
      <Section title={STRINGS.cards.title} description={STRINGS.cards.description}>
        <RadioButtonGroup
          label={STRINGS.cards.name}
          className="flex-row gap-3"
          value={period}
          onValueChange={setPeriod}
        >
          <RadioButtonGroup.Item
            className="flex-1"
            value="quarterly"
            accessibilityLabel={STRINGS.cards.quarterly.title}
          >
            <RadioButtonGroup.ItemContent className="items-center">
              <Label>{STRINGS.cards.quarterly.title}</Label>
              <Description>{STRINGS.cards.quarterly.note}</Description>
            </RadioButtonGroup.ItemContent>
          </RadioButtonGroup.Item>
          <RadioButtonGroup.Item
            className="flex-1"
            value="monthly"
            accessibilityLabel={STRINGS.cards.monthly.title}
          >
            <RadioButtonGroup.ItemContent className="items-center">
              <Label>{STRINGS.cards.monthly.title}</Label>
              <Description>{STRINGS.cards.monthly.note}</Description>
            </RadioButtonGroup.ItemContent>
          </RadioButtonGroup.Item>
        </RadioButtonGroup>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.cards.value} ${period}`}
        </Text>
      </Section>

      <Section title={STRINGS.list.title} description={STRINGS.list.description}>
        <RadioButtonGroup
          label={STRINGS.list.name}
          variant="secondary"
          value={plan}
          onValueChange={setPlan}
        >
          <RadioButtonGroup.Item value="starter" accessibilityLabel={STRINGS.list.starter.title}>
            <Radio />
            <RadioButtonGroup.ItemContent>
              <Label>{STRINGS.list.starter.title}</Label>
              <Description>{STRINGS.list.starter.note}</Description>
            </RadioButtonGroup.ItemContent>
          </RadioButtonGroup.Item>
          <RadioButtonGroup.Item value="team" accessibilityLabel={STRINGS.list.team.title}>
            <Radio />
            <RadioButtonGroup.ItemContent>
              <Label>{STRINGS.list.team.title}</Label>
              <Description>{STRINGS.list.team.note}</Description>
            </RadioButtonGroup.ItemContent>
          </RadioButtonGroup.Item>
          <RadioButtonGroup.Item
            value="enterprise"
            isDisabled
            accessibilityLabel={STRINGS.list.yearly.title}
          >
            <Radio />
            <RadioButtonGroup.ItemContent>
              <Label>{STRINGS.list.yearly.title}</Label>
              <Description>{STRINGS.list.yearly.note}</Description>
            </RadioButtonGroup.ItemContent>
          </RadioButtonGroup.Item>
        </RadioButtonGroup>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <RadioButtonGroup
          label={STRINGS.disabled.name}
          variant="secondary"
          value={speed}
          onValueChange={setSpeed}
          isDisabled
        >
          <RadioButtonGroup.Item
            value="standard"
            accessibilityLabel={STRINGS.disabled.standard.title}
          >
            <Radio />
            <RadioButtonGroup.ItemContent>
              <Label>{STRINGS.disabled.standard.title}</Label>
              <Description>{STRINGS.disabled.standard.note}</Description>
            </RadioButtonGroup.ItemContent>
          </RadioButtonGroup.Item>
          <RadioButtonGroup.Item
            value="express"
            accessibilityLabel={STRINGS.disabled.express.title}
          >
            <Radio />
            <RadioButtonGroup.ItemContent>
              <Label>{STRINGS.disabled.express.title}</Label>
              <Description>{STRINGS.disabled.express.note}</Description>
            </RadioButtonGroup.ItemContent>
          </RadioButtonGroup.Item>
        </RadioButtonGroup>
      </Section>
    </Screen>
  );
}
