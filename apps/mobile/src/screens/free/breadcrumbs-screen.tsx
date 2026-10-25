/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Breadcrumbs` (@stackra/ui): a trail whose earlier steps are
 *          links and whose last step is the current page, a trail that wraps, a one-step trail, a named trail, and a
 *          live trail that goes up when a step is pressed.
 * Boundary: presentation and local demo state only; the trail is @stackra/ui's, nothing here is styled by hand. The
 *          steps press a handler, never a path, because the page has no router to open one.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { BreadcrumbItem } from "@stackra/ui/contracts";
import { Breadcrumbs, Button, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "Earlier steps are links with a handler; the last step is the page you are on.",
  },
  wrapping: {
    title: "A long trail",
    description: "The trail wraps onto a second line instead of running off the screen.",
  },
  single: {
    title: "One step",
    description: "A trail of one step is only the current page, with no link and no chevron.",
    home: "Dashboard",
  },
  named: {
    title: "A named trail",
    description: "`label` is the spoken name of the trail's landmark.",
    label: "Where you are in the catalogue",
  },
  live: {
    title: "Try it",
    description:
      "Press an earlier step to go up to it; Go deeper adds the next step, and the readout names the current page.",
    deeper: "Go deeper",
    current: (label: string) => `Current page: ${label}`,
  },
} as const;

/** The places of every trail, from the root down. */
const PLACES = [
  "Home",
  "Catalogue",
  "Electronics",
  "Audio",
  "Headphones",
  "Over-ear",
  "Wireless",
] as const;

/** A trail of the first `count` places whose earlier steps run `onPress` with the step's depth. */
function trailOf(count: number, onPress: (depth: number) => void): readonly BreadcrumbItem[] {
  return PLACES.slice(0, count).map((label, depth) => ({
    id: label,
    label,
    onPress: () => onPress(depth),
  }));
}

/** Does nothing: a sample whose steps only show how a link looks. */
const ignore = () => undefined;

/** The Breadcrumbs page: one section per option, in a scrollable screen. */
export function BreadcrumbsScreen() {
  const [depth, setDepth] = useState(2);
  const trail = trailOf(depth + 1, setDepth);
  const current = trail.at(-1)?.label ?? PLACES[0];

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <Breadcrumbs items={trailOf(3, ignore)} />
      </Section>

      <Section title={STRINGS.wrapping.title} description={STRINGS.wrapping.description}>
        <Breadcrumbs items={trailOf(PLACES.length, ignore)} />
      </Section>

      <Section title={STRINGS.single.title} description={STRINGS.single.description}>
        <Breadcrumbs items={[{ id: "home", label: STRINGS.single.home }]} />
      </Section>

      <Section title={STRINGS.named.title} description={STRINGS.named.description}>
        <Breadcrumbs items={trailOf(4, ignore)} label={STRINGS.named.label} />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Breadcrumbs items={trail} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.current(current)}
        </Text>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={depth === PLACES.length - 1}
          onPress={() => setDepth((value) => Math.min(value + 1, PLACES.length - 1))}
        >
          {STRINGS.live.deeper}
        </Button>
      </Section>
    </Screen>
  );
}
