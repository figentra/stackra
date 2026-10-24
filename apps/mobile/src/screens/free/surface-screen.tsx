/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Surface` (@stackra/ui): one surface per level, three nested
 *          levels, default and muted text on each level, and a live surface that repaints at the picked level.
 * Boundary: presentation and local demo state only; the surface is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { SurfaceVariant } from "@stackra/ui/contracts";
import { Surface, Text } from "@stackra/ui/native";
import { useState } from "react";

import { ChoiceGroup } from "#src/components/ui/choice-group";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  levels: {
    title: "Levels",
    description: "One surface per `variant`. The transparent one draws no background.",
    level: (level: string) => `Level ${level}`,
    line: "Text on this surface.",
  },
  nested: {
    title: "Nested",
    description: "Default, then secondary inside it, then tertiary inside that.",
  },
  text: {
    title: "Text on each level",
    description: "Default and muted text on every level, the pairs the theme measures.",
    default: "Default text",
    muted: "Muted text",
  },
  live: {
    title: "Try it",
    description: "Pick a level; the surface below repaints and tells you which one it is.",
    pick: "Surface level",
    current: (level: string) => `This surface is ${level}.`,
  },
} as const;

/** The level choices of the live sample. */
const LEVELS = SurfaceVariant.map((level) => ({ value: level, label: level }));

/** The Surface page: one section per option, in a scrollable screen. */
export function SurfaceScreen() {
  const [level, setLevel] = useState<SurfaceVariant>("default");

  return (
    <Screen>
      <Section title={STRINGS.levels.title} description={STRINGS.levels.description}>
        {SurfaceVariant.map((variant) => (
          <Surface key={variant} variant={variant}>
            <Text>{STRINGS.levels.level(variant)}</Text>
            <Text type="small" tone="muted">
              {STRINGS.levels.line}
            </Text>
          </Surface>
        ))}
      </Section>

      <Section title={STRINGS.nested.title} description={STRINGS.nested.description}>
        <Surface variant="default">
          <Text>{STRINGS.levels.level("default")}</Text>
          <Surface variant="secondary">
            <Text>{STRINGS.levels.level("secondary")}</Text>
            <Surface variant="tertiary">
              <Text>{STRINGS.levels.level("tertiary")}</Text>
            </Surface>
          </Surface>
        </Surface>
      </Section>

      <Section title={STRINGS.text.title} description={STRINGS.text.description}>
        {SurfaceVariant.map((variant) => (
          <Surface key={variant} variant={variant}>
            <Text>{STRINGS.text.default}</Text>
            <Text tone="muted">{STRINGS.text.muted}</Text>
          </Surface>
        ))}
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <ChoiceGroup label={STRINGS.live.pick} choices={LEVELS} value={level} onChange={setLevel} />
        <Surface variant={level}>
          <Text accessibilityLiveRegion="polite">{STRINGS.live.current(level)}</Text>
        </Surface>
      </Section>
    </Screen>
  );
}
