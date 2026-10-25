/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `FloatingActionButton` (@stackra-pro/ui): a button that opens
 *          a list of actions, placed automatically from its corner, placed by hand, controlled from outside, and disabled.
 * Boundary: presentation and local demo state only; the button is @stackra-pro/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Text } from "@stackra/ui/native";
import { FloatingActionButton } from "@stackra-pro/ui/native";
import { type ReactNode, useState } from "react";
import { Text as NativeText, View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Automatic placement",
    description:
      "In the bottom end corner the actions open upwards and align to the end; the layout mirrors in right-to-left.",
    label: "Compose",
    items: ["New message", "New label", "New folder"],
    last: "Last action:",
    none: "none yet",
  },
  manual: {
    title: "Manual placement",
    description:
      "`placement` and `align` override the automatic choice: here the actions open below, aligned to the start.",
    label: "Add",
    items: ["Add photo", "Add note"],
  },
  controlled: {
    title: "Controlled",
    description: "`isOpen` and `onOpenChange` drive the menu from outside.",
    label: "Quick actions",
    items: ["Scan", "Share"],
    open: "Open",
    closed: "Closed",
    state: "Menu state:",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` refuses the press and dims the button.",
    label: "Compose, unavailable",
    items: ["New message"],
  },
} as const;

/** The plus sign on the trigger; the button's own accessible name is the `label` prop. */
function PlusGlyph() {
  return <NativeText className="text-2xl text-accent-foreground">+</NativeText>;
}

/** A framed area the demo button sits in, so each button floats over its own box instead of the whole page. */
function Stage({ children }: { children: ReactNode }) {
  return <View className="h-56 rounded-2xl border border-border bg-surface">{children}</View>;
}

/** The FloatingActionButton page: one section per placement and state, in a scrollable screen. */
export function FloatingActionButtonScreen() {
  const [lastAction, setLastAction] = useState<string>(STRINGS.basic.none);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <Stage>
          <FloatingActionButton label={STRINGS.basic.label} className="absolute bottom-4 end-4">
            <FloatingActionButton.Trigger>
              <PlusGlyph />
            </FloatingActionButton.Trigger>
            <FloatingActionButton.Portal>
              <FloatingActionButton.Overlay />
              <FloatingActionButton.Content>
                {STRINGS.basic.items.map((item) => (
                  <FloatingActionButton.Item key={item} onPress={() => setLastAction(item)}>
                    {item}
                  </FloatingActionButton.Item>
                ))}
              </FloatingActionButton.Content>
            </FloatingActionButton.Portal>
          </FloatingActionButton>
        </Stage>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.basic.last} ${lastAction}`}
        </Text>
      </Section>

      <Section title={STRINGS.manual.title} description={STRINGS.manual.description}>
        <Stage>
          <FloatingActionButton
            label={STRINGS.manual.label}
            placement="bottom"
            align="start"
            className="absolute start-4 top-4"
          >
            <FloatingActionButton.Trigger>
              <PlusGlyph />
            </FloatingActionButton.Trigger>
            <FloatingActionButton.Portal>
              <FloatingActionButton.Overlay />
              <FloatingActionButton.Content>
                {STRINGS.manual.items.map((item) => (
                  <FloatingActionButton.Item key={item}>{item}</FloatingActionButton.Item>
                ))}
              </FloatingActionButton.Content>
            </FloatingActionButton.Portal>
          </FloatingActionButton>
        </Stage>
      </Section>

      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <Stage>
          <FloatingActionButton
            label={STRINGS.controlled.label}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            className="absolute bottom-4 end-4"
          >
            <FloatingActionButton.Trigger>
              <PlusGlyph />
            </FloatingActionButton.Trigger>
            <FloatingActionButton.Portal>
              <FloatingActionButton.Overlay />
              <FloatingActionButton.Content>
                {STRINGS.controlled.items.map((item) => (
                  <FloatingActionButton.Item key={item}>{item}</FloatingActionButton.Item>
                ))}
              </FloatingActionButton.Content>
            </FloatingActionButton.Portal>
          </FloatingActionButton>
        </Stage>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.state} ${isOpen ? STRINGS.controlled.open : STRINGS.controlled.closed}`}
        </Text>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <Stage>
          <FloatingActionButton
            label={STRINGS.disabled.label}
            isDisabled
            className="absolute bottom-4 end-4"
          >
            <FloatingActionButton.Trigger>
              <PlusGlyph />
            </FloatingActionButton.Trigger>
            <FloatingActionButton.Portal>
              <FloatingActionButton.Overlay />
              <FloatingActionButton.Content>
                {STRINGS.disabled.items.map((item) => (
                  <FloatingActionButton.Item key={item}>{item}</FloatingActionButton.Item>
                ))}
              </FloatingActionButton.Content>
            </FloatingActionButton.Portal>
          </FloatingActionButton>
        </Stage>
      </Section>
    </Screen>
  );
}
