/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Popover` (@stackra/ui): a popover opened by its trigger,
 *          one with an arrow, each side it can open on, each alignment along that side, a controlled popover with
 *          content of its own and a way to close it, and a popover that a press outside cannot close.
 * Boundary: presentation and local demo state only; the popover is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { Placement, PlacementAlign } from "@stackra/ui/contracts";
import { Button, Popover, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "A trigger opens the popover under it; a press outside closes it.",
    open: "What is a popover?",
    heading: "Popover",
    body: "A small floating panel anchored to the element that opened it.",
  },
  arrow: {
    title: "Arrow",
    description: "`hasArrow` draws an arrow from the popover to its trigger.",
    open: "With an arrow",
    body: "The arrow points back at the button.",
  },
  placement: {
    title: "Placement",
    description:
      "`placement` is the side the popover opens on, named by the reading direction: start and end flip in Arabic.",
    open: (side: string) => `Open on the ${side}`,
    body: (side: string) => `Opened on the ${side} side.`,
  },
  align: {
    title: "Alignment",
    description:
      "`align` lines the popover up with the start, the centre or the end of its trigger.",
    open: (align: string) => `Align at the ${align}`,
    body: (align: string) => `Aligned at the ${align} of the button.`,
  },
  controlled: {
    title: "Controlled",
    description:
      "The page holds `isOpen`; the popover holds content of its own and a button that closes it.",
    open: "Share this page",
    heading: "Share",
    body: "Anyone with the link can read this page.",
    done: "Done",
    state: (isOpen: boolean) => `The popover is ${isOpen ? "open" : "closed"}.`,
  },
  locked: {
    title: "Not dismissable",
    description: "`isDismissable` off: a press outside does nothing, so the content closes it.",
    open: "Open the locked popover",
    heading: "Unsaved changes",
    body: "Save or discard your changes to carry on.",
    discard: "Discard",
  },
} as const;

/** The Popover page: one section per option, in a scrollable screen. */
export function PopoverScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLockedOpen, setIsLockedOpen] = useState(false);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <Popover
          title={STRINGS.basics.heading}
          trigger={<Button variant="secondary">{STRINGS.basics.open}</Button>}
        >
          {STRINGS.basics.body}
        </Popover>
      </Section>

      <Section title={STRINGS.arrow.title} description={STRINGS.arrow.description}>
        <Popover hasArrow trigger={<Button variant="secondary">{STRINGS.arrow.open}</Button>}>
          {STRINGS.arrow.body}
        </Popover>
      </Section>

      <Section title={STRINGS.placement.title} description={STRINGS.placement.description}>
        {Placement.map((side) => (
          <Popover
            key={side}
            placement={side}
            trigger={
              <Button variant="secondary" size="sm">
                {STRINGS.placement.open(side)}
              </Button>
            }
          >
            {STRINGS.placement.body(side)}
          </Popover>
        ))}
      </Section>

      <Section title={STRINGS.align.title} description={STRINGS.align.description}>
        {PlacementAlign.map((align) => (
          <Popover
            key={align}
            align={align}
            trigger={
              <Button variant="secondary" size="sm">
                {STRINGS.align.open(align)}
              </Button>
            }
          >
            {STRINGS.align.body(align)}
          </Popover>
        ))}
      </Section>

      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <Popover
          title={STRINGS.controlled.heading}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          trigger={<Button variant="secondary">{STRINGS.controlled.open}</Button>}
        >
          <Text>{STRINGS.controlled.body}</Text>
          <Button size="sm" onPress={() => setIsOpen(false)}>
            {STRINGS.controlled.done}
          </Button>
        </Popover>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.controlled.state(isOpen)}
        </Text>
      </Section>

      <Section title={STRINGS.locked.title} description={STRINGS.locked.description}>
        <Popover
          title={STRINGS.locked.heading}
          isDismissable={false}
          isOpen={isLockedOpen}
          onOpenChange={setIsLockedOpen}
          trigger={<Button variant="secondary">{STRINGS.locked.open}</Button>}
        >
          <Text>{STRINGS.locked.body}</Text>
          <Button size="sm" variant="tertiary" onPress={() => setIsLockedOpen(false)}>
            {STRINGS.locked.discard}
          </Button>
        </Popover>
      </Section>
    </Screen>
  );
}
