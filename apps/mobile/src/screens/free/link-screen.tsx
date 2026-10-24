/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Link` (@stackra/ui): each tone with each underline, a link in
 *          running text, an external link, the disabled, press-only and labelled states, and a long Arabic link.
 * Boundary: presentation and local demo state only; the link is @stackra/ui's, nothing here is styled by hand. No
 *          RouterProvider wraps the app, so an app path would open in the browser: every href here is absolute.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { LinkUnderline, Tone } from "@stackra/ui/contracts";
import { Link, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

/** The page every sample link points to. */
const HEROUI_URL = "https://heroui.com";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  tones: {
    title: "Tones",
    description: "One link per `tone`, with each `underline`: `hover` (standalone) and `always`.",
  },
  running: {
    title: "In running text",
    description: "A link in a paragraph stays underlined, so colour alone does not tell it apart.",
    before: "Read the",
    link: "HeroUI documentation",
    after: "before you theme a component.",
  },
  external: {
    title: "External",
    description:
      "`isExternal` opens the system browser, shows the external mark at the inline end and says so to screen readers.",
    text: "HeroUI documentation",
  },
  states: {
    title: "States",
    description: "`isDisabled`, press only (no `href`), and a `label` more specific than the text.",
    disabled: "Disabled link",
    press: "Press only",
    presses: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}.`,
    labelled: "Docs",
    label: "HeroUI documentation website",
  },
  long: {
    title: "Long text",
    description: "An Arabic sentence with a link that wraps across lines.",
    before: "هذه جملة عربية طويلة تحتوي على",
    link: "رابط يلتف عبر عدة أسطر داخل الجملة",
    after: "، ثم تتابع الجملة بعده.",
  },
} as const;

/** The Link page: one section per option, in a scrollable screen. */
export function LinkScreen() {
  const [presses, setPresses] = useState(0);

  return (
    <Screen>
      <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
        {LinkUnderline.map((underline) => (
          <Sample key={underline} caption={underline}>
            <View className="flex-row flex-wrap gap-4">
              {Tone.map((tone) => (
                <Link key={tone} href={HEROUI_URL} tone={tone} underline={underline}>
                  {tone}
                </Link>
              ))}
            </View>
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.running.title} description={STRINGS.running.description}>
        <View className="flex-row flex-wrap items-center gap-1">
          <Text>{STRINGS.running.before}</Text>
          <Link href={HEROUI_URL}>{STRINGS.running.link}</Link>
          <Text>{STRINGS.running.after}</Text>
        </View>
      </Section>

      <Section title={STRINGS.external.title} description={STRINGS.external.description}>
        <Link href={HEROUI_URL} isExternal>
          {STRINGS.external.text}
        </Link>
        <Link href={HEROUI_URL} isExternal tone="accent" underline="hover">
          {STRINGS.external.text}
        </Link>
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <Link href={HEROUI_URL} isDisabled>
          {STRINGS.states.disabled}
        </Link>
        <View className="flex-row flex-wrap items-center gap-3">
          <Link onPress={() => setPresses((count) => count + 1)}>{STRINGS.states.press}</Link>
          <Text tone="muted" accessibilityLiveRegion="polite">
            {STRINGS.states.presses(presses)}
          </Text>
        </View>
        <Link href={HEROUI_URL} label={STRINGS.states.label}>
          {STRINGS.states.labelled}
        </Link>
      </Section>

      <Section title={STRINGS.long.title} description={STRINGS.long.description}>
        <View className="flex-row flex-wrap items-center gap-1">
          <Text lang="ar">{STRINGS.long.before}</Text>
          <Link href={HEROUI_URL}>{STRINGS.long.link}</Link>
          <Text lang="ar">{STRINGS.long.after}</Text>
        </View>
      </Section>
    </Screen>
  );
}
