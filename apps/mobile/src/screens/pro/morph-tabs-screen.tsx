/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `MorphTabs` (@stackra/ui-pro): pill tabs whose active pill
 *          grows to show its label while a pager swipes between pages, one controlled with the page read back and its
 *          pages mounted lazily, and one with the list below the pager like a bottom bar.
 * Boundary: presentation and local demo state only; the tabs are @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Text } from "@stackra/ui/native";
import { MorphTabs } from "@stackra/ui-pro/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Swipe and tap",
    description: "Tap a pill or swipe the page; the active pill grows to show its label.",
    name: "Sections",
  },
  controlled: {
    title: "Controlled and lazy",
    description: "`value` follows the page; with `lazy` a page mounts the first time it is shown.",
    name: "Account sections",
    value: "Page:",
  },
  bottom: {
    title: "List below the pager",
    description: "Placing `MorphTabs.List` after the pager makes a bottom tab bar.",
    name: "Bottom sections",
  },
  pages: {
    home: { label: "Home", body: "The home page." },
    today: { label: "Today", body: "What is due today." },
    notes: { label: "Notes", body: "Your notes." },
  },
} as const;

/** The tabs of the demo, in swipe order; each icon is a plain glyph so the page needs no icon library. */
const TABS = [
  { value: "home", glyph: "⌂", ...STRINGS.pages.home },
  { value: "today", glyph: "◷", ...STRINGS.pages.today },
  { value: "notes", glyph: "✎", ...STRINGS.pages.notes },
] as const;

/** The list of triggers, as one fragment so each demo shows the same three tabs. */
function TabList({ name }: { name: string }) {
  return (
    <MorphTabs.List label={name}>
      {TABS.map((tab) => (
        <MorphTabs.Trigger key={tab.value} value={tab.value}>
          <MorphTabs.Icon>
            <Text>{tab.glyph}</Text>
          </MorphTabs.Icon>
          <MorphTabs.Label>{tab.label}</MorphTabs.Label>
        </MorphTabs.Trigger>
      ))}
    </MorphTabs.List>
  );
}

/** The pager with one page per tab. */
function TabPages() {
  return (
    <MorphTabs.Pager>
      {TABS.map((tab) => (
        <MorphTabs.Content key={tab.value} value={tab.value}>
          <View className="flex-1 items-center justify-center p-4">
            <Text>{tab.body}</Text>
          </View>
        </MorphTabs.Content>
      ))}
    </MorphTabs.Pager>
  );
}

/** The MorphTabs page: one section per arrangement, in a scrollable screen. */
export function MorphTabsScreen() {
  const [page, setPage] = useState("home");

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <MorphTabs defaultValue="home" className="h-48 gap-2">
          <TabList name={STRINGS.basic.name} />
          <TabPages />
        </MorphTabs>
      </Section>

      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <MorphTabs value={page} onValueChange={setPage} lazy className="h-48 gap-2">
          <TabList name={STRINGS.controlled.name} />
          <TabPages />
        </MorphTabs>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.value} ${page}`}
        </Text>
      </Section>

      <Section title={STRINGS.bottom.title} description={STRINGS.bottom.description}>
        <MorphTabs defaultValue="today" className="h-48 gap-2">
          <TabPages />
          <TabList name={STRINGS.bottom.name} />
        </MorphTabs>
      </Section>
    </Screen>
  );
}
