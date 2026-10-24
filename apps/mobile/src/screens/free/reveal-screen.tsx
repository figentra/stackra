/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Reveal` (@stackra/ui): one entrance, a staggered row, the
 *          entrance turned off, and a Reveal placed inside a surface around its content, each with a button that
 *          mounts the samples again so the entrance plays once more.
 * Boundary: presentation and local demo state only; the entrance is @stackra/ui's, timed by the theme's `reveal` and
 *          `stagger` steps. The system's reduce-motion setting shows every sample at once.
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 6); STA-430.
 */
import { Button, Card, Reveal, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  replay: "Play the entrance again",
  single: {
    title: "Entrance",
    description:
      "The content fades in and rises 8 points into place when it mounts, over the theme's reveal step.",
    body: "Your report is ready.",
  },
  stagger: {
    title: "Staggered",
    description: "`index` waits one stagger step (40 ms) per place, so a row arrives in order.",
    rows: ["Invoices", "Payments", "Refunds", "Payouts"],
  },
  off: {
    title: "Turned off",
    description: "`isAnimated={false}` shows the content at once, as reduce motion does.",
    body: "No entrance here.",
  },
  inside: {
    title: "Inside a surface",
    description:
      "A Reveal goes inside a surface, around its content, never around the surface: Liquid Glass breaks when a parent changes opacity.",
    heading: "Monthly summary",
    body: "Revenue is up 12% on last month.",
  },
} as const;

/** The Reveal page: each section mounts again when the replay button is pressed. */
export function RevealScreen() {
  const [run, setRun] = useState(0);

  return (
    <Screen>
      <Button size="sm" variant="secondary" onPress={() => setRun((count) => count + 1)}>
        {STRINGS.replay}
      </Button>

      <Section title={STRINGS.single.title} description={STRINGS.single.description}>
        <Reveal key={run}>
          <Card>
            <Text>{STRINGS.single.body}</Text>
          </Card>
        </Reveal>
      </Section>

      <Section title={STRINGS.stagger.title} description={STRINGS.stagger.description}>
        <View key={run} className="gap-2">
          {STRINGS.stagger.rows.map((row, index) => (
            <Reveal key={row} index={index}>
              <Card>
                <Text>{row}</Text>
              </Card>
            </Reveal>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.off.title} description={STRINGS.off.description}>
        <Reveal key={run} isAnimated={false}>
          <Card>
            <Text>{STRINGS.off.body}</Text>
          </Card>
        </Reveal>
      </Section>

      <Section title={STRINGS.inside.title} description={STRINGS.inside.description}>
        <Card>
          <Reveal key={run}>
            <View className="gap-1">
              <Text type="small" tone="muted">
                {STRINGS.inside.heading}
              </Text>
              <Text>{STRINGS.inside.body}</Text>
            </View>
          </Reveal>
        </Card>
      </Section>
    </Screen>
  );
}
