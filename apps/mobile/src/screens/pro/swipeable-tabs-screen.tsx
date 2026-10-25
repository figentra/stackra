/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `SwipeableTabs` (@stackra-pro/ui): a tab list whose indicator
 *          follows a swiping pager, the controlled form with lazy pages and the page read back, and the secondary
 *          (underlined) variant with a scrollable list.
 * Boundary: presentation and local demo state only; the tabs are @stackra-pro/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Text } from "@stackra/ui/native";
import { SwipeableTabs } from "@stackra-pro/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Swipe and tap",
    description: "The indicator slides and resizes with the swipe, not only after it ends.",
    name: "Account sections",
  },
  controlled: {
    title: "Controlled and lazy",
    description: "`value` follows the page; with `lazy` a page mounts the first time it is shown.",
    name: "Account sections, controlled",
    value: "Page:",
  },
  secondary: {
    title: "Secondary variant, scrollable",
    description:
      '`variant="secondary"` underlines the list; `ScrollView` scrolls it when it overflows.',
    name: "Account sections, underlined",
  },
  tabs: {
    overview: { label: "Overview", body: "A summary of the account." },
    activity: { label: "Activity", body: "Recent activity." },
    settings: { label: "Settings", body: "Account settings." },
    billing: { label: "Billing", body: "Invoices and payment methods." },
    security: { label: "Security", body: "Sign-in and devices." },
  },
} as const;

const TABS = [
  { value: "overview", ...STRINGS.tabs.overview },
  { value: "activity", ...STRINGS.tabs.activity },
  { value: "settings", ...STRINGS.tabs.settings },
] as const;

const MORE_TABS = [
  ...TABS,
  { value: "billing", ...STRINGS.tabs.billing },
  { value: "security", ...STRINGS.tabs.security },
] as const;

/** One page of the demo: its body text, centred in the page. */
function Page({ body }: { body: string }) {
  return (
    <View className="flex-1 items-center justify-center p-4">
      <Text>{body}</Text>
    </View>
  );
}

/** The pager with one page per tab of the given set. */
function Pages({ tabs }: { tabs: readonly { value: string; body: string }[] }) {
  return (
    <SwipeableTabs.Pager>
      {tabs.map((tab) => (
        <SwipeableTabs.Content key={tab.value} value={tab.value}>
          <Page body={tab.body} />
        </SwipeableTabs.Content>
      ))}
    </SwipeableTabs.Pager>
  );
}

/** The SwipeableTabs page: one section per variant, in a scrollable screen. */
export function SwipeableTabsScreen() {
  const [page, setPage] = useState("overview");

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <SwipeableTabs defaultValue="overview" className="h-48 gap-2">
          <SwipeableTabs.List label={STRINGS.basic.name}>
            <SwipeableTabs.Indicator />
            {TABS.map((tab) => (
              <SwipeableTabs.Trigger key={tab.value} value={tab.value}>
                <SwipeableTabs.Label>{tab.label}</SwipeableTabs.Label>
              </SwipeableTabs.Trigger>
            ))}
          </SwipeableTabs.List>
          <Pages tabs={TABS} />
        </SwipeableTabs>
      </Section>

      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <SwipeableTabs value={page} onValueChange={setPage} lazy className="h-48 gap-2">
          <SwipeableTabs.List label={STRINGS.controlled.name}>
            <SwipeableTabs.Indicator />
            {TABS.map((tab) => (
              <SwipeableTabs.Trigger key={tab.value} value={tab.value}>
                <SwipeableTabs.Label>{tab.label}</SwipeableTabs.Label>
              </SwipeableTabs.Trigger>
            ))}
          </SwipeableTabs.List>
          <Pages tabs={TABS} />
        </SwipeableTabs>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.value} ${page}`}
        </Text>
      </Section>

      <Section title={STRINGS.secondary.title} description={STRINGS.secondary.description}>
        <SwipeableTabs defaultValue="overview" variant="secondary" className="h-48 gap-2">
          <SwipeableTabs.List label={STRINGS.secondary.name} className="self-stretch">
            <SwipeableTabs.ScrollView>
              <SwipeableTabs.Indicator />
              {MORE_TABS.map((tab) => (
                <SwipeableTabs.Trigger key={tab.value} value={tab.value}>
                  <SwipeableTabs.Label>{tab.label}</SwipeableTabs.Label>
                </SwipeableTabs.Trigger>
              ))}
            </SwipeableTabs.ScrollView>
          </SwipeableTabs.List>
          <Pages tabs={MORE_TABS} />
        </SwipeableTabs>
      </Section>
    </Screen>
  );
}
