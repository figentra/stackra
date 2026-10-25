/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Tabs` (@stackra/ui): a tab list with a panel for each tab,
 *          each variant, a refused tab and a refused list, the empty and the loading tabs, and a live list whose
 *          selected tab is named in a readout.
 * Boundary: presentation and local demo state only; the tabs are @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { TabItem } from "@stackra/ui/contracts";
import { EmptyState, Tabs, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "One tab is always selected; its panel shows under the list.",
    label: "Order sections",
  },
  variants: {
    title: "Variants",
    description: "`variant`: the selected tab as a raised pill, or as a flat one.",
    label: (variant: string) => `Sections, ${variant} variant`,
  },
  states: {
    title: "States",
    description:
      "A tab can be shown and refused: Billing is disabled. `isDisabled` refuses every tab.",
    label: "Settings sections",
    disabled: "Whole list disabled",
    disabledLabel: "Settings sections, all refused",
  },
  empty: {
    title: "Empty and loading",
    description:
      "No tabs shows `emptyState`; while `isLoading` it shows a spinner named by `loadingLabel`.",
    label: "Sections, empty",
    heading: "No sections",
    body: "Sections appear once the order has activity.",
    loadingLabel: "Sections, loading",
    loading: "Loading the sections",
  },
  live: {
    title: "Try it",
    description: "Choose a tab; the readout names the one selected.",
    label: "Account sections",
    selected: (id: string | undefined) => `Selected tab: ${id ?? "none"}`,
  },
} as const;

/** The tabs of every sample: each panel holds a line of text. */
const SECTIONS: readonly TabItem[] = [
  { id: "overview", label: "Overview", content: "A summary of the order and its status." },
  { id: "items", label: "Items", content: "Three items, packed in two boxes." },
  {
    id: "history",
    label: "History",
    content: "Created, paid and shipped on three different days.",
  },
];

/** The tabs with a refused one. */
const SETTINGS: readonly TabItem[] = [
  { id: "profile", label: "Profile", content: "Your name, photo and email address." },
  {
    id: "billing",
    label: "Billing",
    content: "Billing is managed by the workspace owner.",
    isDisabled: true,
  },
  { id: "security", label: "Security", content: "Your password and two-step sign-in." },
];

/** The Tabs page: one section per option, in a scrollable screen. */
export function TabsScreen() {
  const [selected, setSelected] = useState<readonly string[]>(["items"]);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <Tabs label={STRINGS.basics.label} items={SECTIONS} />
      </Section>

      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        <Tabs label={STRINGS.variants.label("primary")} items={SECTIONS} variant="primary" />
        <Tabs label={STRINGS.variants.label("secondary")} items={SECTIONS} variant="secondary" />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <Tabs label={STRINGS.states.label} items={SETTINGS} />
        <Text type="small" tone="muted">
          {STRINGS.states.disabled}
        </Text>
        <Tabs label={STRINGS.states.disabledLabel} items={SECTIONS} isDisabled />
      </Section>

      <Section title={STRINGS.empty.title} description={STRINGS.empty.description}>
        <Tabs
          label={STRINGS.empty.label}
          items={[]}
          emptyState={
            <EmptyState
              headingLevel={3}
              title={STRINGS.empty.heading}
              description={STRINGS.empty.body}
            />
          }
        />
        <Tabs
          label={STRINGS.empty.loadingLabel}
          items={[]}
          isLoading
          loadingLabel={STRINGS.empty.loading}
        />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Tabs
          label={STRINGS.live.label}
          items={SECTIONS}
          selectedKeys={selected}
          onSelectionChange={setSelected}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.selected(selected[0])}
        </Text>
      </Section>
    </Screen>
  );
}
