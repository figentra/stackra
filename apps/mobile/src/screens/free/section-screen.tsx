/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Section` of @stackra/ui, a titled card for one block of a
 *          detail page: a title with a description, leading and trailing content, the section's actions (three show
 *          as buttons, the rest go in a menu), a nested section one level down, and a readout of the action chosen.
 * Boundary: presentation and local demo state only; the card is @stackra/ui's, nothing here is styled by hand. The
 *          review page's own `Section` heads each block of this page, so @stackra/ui's is imported as `CardSection`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { MenuLeafItem } from "@stackra/ui/contracts";
import { Avatar, Chip, Section as CardSection, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "A card with a title, a line under it and a body.",
    heading: "Shipping address",
    body: "Under the title, a line says what the section holds.",
    content: "12 Nile Corniche, Cairo. Deliveries are signed for at the front desk.",
  },
  slots: {
    title: "Leading and trailing content",
    description:
      "`startContent` leads the title, such as an avatar; `endContent` follows the actions.",
    heading: "Account owner",
    body: "The person who pays for the workspace.",
    name: "Ada Lovelace",
    chip: "Owner",
    content: "ada@example.com",
  },
  actions: {
    title: "Actions",
    description:
      "The first action is primary and at most three show as buttons; the rest go in a menu under a button of its own.",
    heading: "Payment methods",
    body: "Cards charged for the workspace.",
    moreLabel: "More payment actions",
    add: "Add a card",
    edit: "Edit",
    remove: "Remove",
    content: "Visa ending in 4242, expiring in 2028.",
    last: (id: string | null) => `Last action: ${id ?? "none"}`,
  },
  nested: {
    title: "Nested sections",
    description:
      "`headingLevel` keeps the outline right: this card is level 2 and the one inside is level 3.",
    heading: "Notifications",
    body: "How and when we get in touch.",
    innerHeading: "Email",
    innerBody: "A summary every morning at 8.",
  },
} as const;

/** The Section page: one section per option, in a scrollable screen. */
export function SectionScreen() {
  const [last, setLast] = useState<string | null>(null);

  const actions: readonly MenuLeafItem[] = [
    { id: "add", label: STRINGS.actions.add, icon: "plus", onPress: () => setLast("add") },
    { id: "edit", label: STRINGS.actions.edit, icon: "pencil", onPress: () => setLast("edit") },
    {
      id: "remove",
      label: STRINGS.actions.remove,
      icon: "trash",
      tone: "danger",
      onPress: () => setLast("remove"),
    },
  ];

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <CardSection title={STRINGS.basics.heading} description={STRINGS.basics.body}>
          {STRINGS.basics.content}
        </CardSection>
      </Section>

      <Section title={STRINGS.slots.title} description={STRINGS.slots.description}>
        <CardSection
          title={STRINGS.slots.heading}
          description={STRINGS.slots.body}
          startContent={<Avatar name={STRINGS.slots.name} />}
          endContent={<Chip size="sm">{STRINGS.slots.chip}</Chip>}
        >
          {STRINGS.slots.content}
        </CardSection>
      </Section>

      <Section title={STRINGS.actions.title} description={STRINGS.actions.description}>
        <CardSection
          title={STRINGS.actions.heading}
          description={STRINGS.actions.body}
          actions={actions}
          moreActionsLabel={STRINGS.actions.moreLabel}
        >
          {STRINGS.actions.content}
        </CardSection>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.actions.last(last)}
        </Text>
      </Section>

      <Section title={STRINGS.nested.title} description={STRINGS.nested.description}>
        <CardSection title={STRINGS.nested.heading} description={STRINGS.nested.body}>
          <CardSection
            variant="secondary"
            headingLevel={3}
            title={STRINGS.nested.innerHeading}
            description={STRINGS.nested.innerBody}
          />
        </CardSection>
      </Section>
    </Screen>
  );
}
