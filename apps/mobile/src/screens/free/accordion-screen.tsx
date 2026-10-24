/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Accordion` (@stackra/ui): one section open at a time, several
 *          open, each variant, a refused section and a refused accordion, and a live accordion whose open sections are
 *          listed.
 * Boundary: presentation and local demo state only; the accordion is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { AccordionVariant, type AccordionItem } from "@stackra/ui/contracts";
import { Accordion, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "Opening a section closes the one that was open; the first one starts open.",
  },
  several: {
    title: "Several open",
    description: "`canExpandMultiple` lets sections stay open together; two start open here.",
  },
  variants: {
    title: "Variants",
    description: "`variant`: on the page's own surface, or as a panel of its own.",
    first: (name: string) => `The ${name} variant, first section`,
    second: (name: string) => `The ${name} variant, second section`,
    body: "What the section reveals while it is open.",
  },
  states: {
    title: "States",
    description:
      "A section can be shown and refused: Returns is disabled. `isDisabled` refuses every section.",
    disabled: "Whole accordion disabled",
  },
  live: {
    title: "Try it",
    description: "Open and close sections; the readout lists the ids that are open, in order.",
    open: (ids: string) => `Open: ${ids}`,
    none: "nothing",
  },
} as const;

/** The sections of every sample; Returns is refused. */
const FAQ: readonly AccordionItem[] = [
  {
    id: "shipping",
    title: "How long does shipping take?",
    content: "Orders leave the warehouse within one working day and arrive in three to five.",
  },
  {
    id: "payment",
    title: "Which payment methods do you accept?",
    content: "Cards, bank transfer and cash on delivery in selected cities.",
  },
  {
    id: "returns",
    title: "Returns",
    content: "Returns are closed for this order.",
    isDisabled: true,
  },
  {
    id: "support",
    title: "How do I reach support?",
    content: "Write to support at any hour; a person answers within a day.",
  },
];

/** The Accordion page: one section per option, in a scrollable screen. */
export function AccordionScreen() {
  const [expanded, setExpanded] = useState<readonly string[]>(["payment"]);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <Accordion items={FAQ} defaultExpandedKeys={["shipping"]} />
      </Section>

      <Section title={STRINGS.several.title} description={STRINGS.several.description}>
        <Accordion items={FAQ} canExpandMultiple defaultExpandedKeys={["shipping", "support"]} />
      </Section>

      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        {AccordionVariant.map((variant) => (
          <Accordion
            key={variant}
            items={[
              {
                id: "first",
                title: STRINGS.variants.first(variant),
                content: STRINGS.variants.body,
              },
              {
                id: "second",
                title: STRINGS.variants.second(variant),
                content: STRINGS.variants.body,
              },
            ]}
            variant={variant}
            defaultExpandedKeys={["first"]}
          />
        ))}
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <Accordion items={FAQ} />
        <Text type="small" tone="muted">
          {STRINGS.states.disabled}
        </Text>
        <Accordion items={FAQ.slice(0, 2)} isDisabled defaultExpandedKeys={["shipping"]} />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Accordion
          items={FAQ}
          canExpandMultiple
          expandedKeys={expanded}
          onExpandedChange={setExpanded}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.open(expanded.length === 0 ? STRINGS.live.none : expanded.join(", "))}
        </Text>
      </Section>
    </Screen>
  );
}
