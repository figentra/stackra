/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `MorphButton` (@stackra/ui-pro): a button that grows into a
 *          panel, in its two variants, in four directions, controlled from outside, and disabled.
 * Boundary: presentation and local demo state only; the button is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { MorphButton } from "@stackra/ui-pro/native";
import { Button, Typography } from "heroui-native";
import { type ReactNode, useState } from "react";
import { Text, View } from "react-native";

import { ChoiceGroup } from "#src/components/ui/choice-group";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  variants: {
    title: "Variants",
    description:
      "`primary` is an inverted surface for floating over content; `secondary` reads on a card. Press to expand.",
    items: [
      { variant: "primary", label: "Open order summary" },
      { variant: "secondary", label: "Open order summary, secondary" },
    ],
    collapsed: "2 products in bag",
    panelTitle: "Order summary",
    subtotal: "Subtotal",
    amount: "208",
  },
  directions: {
    title: "Directions",
    description:
      "`direction` is the way the surface grows; `start` and `end` are logical and mirror in right-to-left.",
    group: "Direction",
    label: "Open directions demo",
    collapsed: "Filters",
    panel: "Sort and filter options appear here.",
    choices: [
      { value: "top", label: "Top" },
      { value: "bottom", label: "Bottom" },
      { value: "start", label: "Start" },
      { value: "end", label: "End" },
    ],
  },
  controlled: {
    title: "Controlled",
    description:
      "`isOpen` and `onOpenChange` drive the button from outside; a button inside the panel closes it.",
    label: "Open help panel",
    collapsed: "Help",
    panel: "Need a hand? Contact support any time.",
    close: "Close",
    open: "Open",
    closed: "Closed",
    state: "State:",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` refuses the press and dims the button.",
    label: "Open panel, unavailable",
    collapsed: "Unavailable",
    panel: "This panel never opens.",
  },
} as const;

type Variant = "primary" | "secondary";
type Direction = "top" | "bottom" | "start" | "end";

/** Text on the morphing surface: the primary variant is inverted, the secondary uses the normal foreground. */
function Label({ variant, children }: { variant: Variant; children: ReactNode }) {
  return (
    <Text
      className={
        variant === "primary"
          ? "text-sm font-medium text-background"
          : "text-sm font-medium text-foreground"
      }
    >
      {children}
    </Text>
  );
}

/** A framed area with room around the button so it can grow in any direction. */
function Stage({ children }: { children: ReactNode }) {
  return (
    <View className="h-64 items-center justify-center rounded-2xl border border-border bg-surface">
      {children}
    </View>
  );
}

/** The MorphButton page: one section per variant, direction and state, in a scrollable screen. */
export function MorphButtonScreen() {
  const [direction, setDirection] = useState<Direction>("top");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Screen>
      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        {STRINGS.variants.items.map(({ variant, label }) => (
          <Stage key={variant}>
            <MorphButton label={label} variant={variant} direction="bottom">
              <MorphButton.CollapsedContent>
                <Label variant={variant}>{STRINGS.variants.collapsed}</Label>
              </MorphButton.CollapsedContent>
              <MorphButton.ExpandedContent className="w-64">
                <Label variant={variant}>{STRINGS.variants.panelTitle}</Label>
                <Label
                  variant={variant}
                >{`${STRINGS.variants.subtotal}: ${STRINGS.variants.amount}`}</Label>
              </MorphButton.ExpandedContent>
            </MorphButton>
          </Stage>
        ))}
      </Section>

      <Section title={STRINGS.directions.title} description={STRINGS.directions.description}>
        <ChoiceGroup
          label={STRINGS.directions.group}
          choices={STRINGS.directions.choices}
          value={direction}
          onChange={setDirection}
        />
        <Stage>
          <MorphButton label={STRINGS.directions.label} direction={direction}>
            <MorphButton.CollapsedContent>
              <Label variant="primary">{STRINGS.directions.collapsed}</Label>
            </MorphButton.CollapsedContent>
            <MorphButton.ExpandedContent className="w-48">
              <Label variant="primary">{STRINGS.directions.panel}</Label>
            </MorphButton.ExpandedContent>
          </MorphButton>
        </Stage>
      </Section>

      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <Stage>
          <MorphButton
            label={STRINGS.controlled.label}
            direction="bottom"
            isOpen={isOpen}
            onOpenChange={setIsOpen}
          >
            <MorphButton.CollapsedContent>
              <Label variant="primary">{STRINGS.controlled.collapsed}</Label>
            </MorphButton.CollapsedContent>
            <MorphButton.ExpandedContent className="w-64">
              <Label variant="primary">{STRINGS.controlled.panel}</Label>
              <Button size="sm" variant="secondary" onPress={() => setIsOpen(false)}>
                {STRINGS.controlled.close}
              </Button>
            </MorphButton.ExpandedContent>
          </MorphButton>
        </Stage>
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.state} ${isOpen ? STRINGS.controlled.open : STRINGS.controlled.closed}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <Stage>
          <MorphButton label={STRINGS.disabled.label} direction="bottom" isDisabled>
            <MorphButton.CollapsedContent>
              <Label variant="primary">{STRINGS.disabled.collapsed}</Label>
            </MorphButton.CollapsedContent>
            <MorphButton.ExpandedContent className="w-64">
              <Label variant="primary">{STRINGS.disabled.panel}</Label>
            </MorphButton.ExpandedContent>
          </MorphButton>
        </Stage>
      </Section>
    </Screen>
  );
}
