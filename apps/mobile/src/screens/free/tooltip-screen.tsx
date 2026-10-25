/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Tooltip` (@stackra/ui): a button and an icon button that carry
 *          a tooltip, with the hint it adds written under each, a button that already has a hint of its own, and a
 *          live button whose presses are counted.
 * Boundary: presentation and local demo state only; the tooltip is @stackra/ui's, nothing here is styled by hand. A
 *          phone has no hover, so the native tooltip draws nothing: it is the element's accessibility hint, which
 *          VoiceOver and TalkBack read after the element's name. The captions repeat the hint so it can be seen.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { Button, IconButton, Text, Tooltip } from "@stackra/ui/native";
import { useState } from "react";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description:
      "The tooltip's text becomes the button's accessibility hint; a screen reader says it after the button's name.",
    button: "Export",
    hint: "Downloads the orders as a spreadsheet.",
    caption: (hint: string) => `Hint: ${hint}`,
  },
  icon: {
    title: "An icon button",
    description:
      "An icon button is named by its label; the tooltip adds what it will do, which is where a hover label helps most.",
    label: "Delete",
    hint: "Removes the order for good.",
  },
  own: {
    title: "A hint of its own",
    description:
      "A button that already has an `accessibilityHint` keeps it; the tooltip never replaces it.",
    button: "Archive",
    ownHint: "Moves the order to the archive.",
    tooltipHint: "This text is not used.",
  },
  live: {
    title: "Try it",
    description: "The tooltip does not change what a press does; the readout counts the presses.",
    button: "Sync now",
    hint: "Fetches the latest orders.",
    pressed: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}.`,
  },
} as const;

/** The Tooltip page: one section per option, in a scrollable screen. */
export function TooltipScreen() {
  const [count, setCount] = useState(0);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <Sample caption={STRINGS.basics.caption(STRINGS.basics.hint)}>
          <Tooltip content={STRINGS.basics.hint}>
            <Button variant="secondary">{STRINGS.basics.button}</Button>
          </Tooltip>
        </Sample>
      </Section>

      <Section title={STRINGS.icon.title} description={STRINGS.icon.description}>
        <Sample caption={STRINGS.basics.caption(STRINGS.icon.hint)}>
          <Tooltip content={STRINGS.icon.hint}>
            <IconButton icon="trash" label={STRINGS.icon.label} variant="danger-soft" />
          </Tooltip>
        </Sample>
      </Section>

      <Section title={STRINGS.own.title} description={STRINGS.own.description}>
        <Sample caption={STRINGS.basics.caption(STRINGS.own.ownHint)}>
          <Tooltip content={STRINGS.own.tooltipHint}>
            <Button variant="secondary" accessibilityHint={STRINGS.own.ownHint}>
              {STRINGS.own.button}
            </Button>
          </Tooltip>
        </Sample>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Tooltip content={STRINGS.live.hint}>
          <Button variant="secondary" onPress={() => setCount((value) => value + 1)}>
            {STRINGS.live.button}
          </Button>
        </Tooltip>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.pressed(count)}
        </Text>
      </Section>
    </Screen>
  );
}
