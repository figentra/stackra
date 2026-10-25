/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `List` and its `ListItem` rows (@stackra/ui): rows with a title
 *          and a second line, with a leading icon or avatar, trailing content and a chevron, pressable and refused
 *          rows, one and several selected with a readout of the ids, the surfaces a list sits on, and the empty and
 *          the loading list.
 * Boundary: presentation and local demo state only; the list and its rows are @stackra/ui's, nothing here is styled
 *          by hand. A row is a `ListItemData` entry of `items`, so `ListItem` is exercised through the list. The list
 *          draws its rows in a `FlatList`, so the samples keep their rows few.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { SurfaceVariant, type ListItemData } from "@stackra/ui/contracts";
import { Avatar, Chip, EmptyState, List, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "Each row has a title, and a muted line under it when it has a description.",
    label: "Recent orders",
  },
  rows: {
    title: "Row content",
    description:
      "A leading icon or avatar, trailing content such as a chip, and a chevron that says the row opens something.",
    label: "Team",
    owner: "Owner",
    admin: "Admin",
  },
  press: {
    title: "Pressable and refused rows",
    description:
      "A row with `onPress` is a button; one can be shown but refused: Archived is disabled and dimmed.",
    label: "Projects",
    pressed: (title: string | null) => `Last opened: ${title ?? "none"}`,
  },
  surfaces: {
    title: "Surfaces",
    description: "`variant`: the surface level the rows sit on.",
    label: (variant: string) => `Orders on the ${variant} surface`,
  },
  states: {
    title: "Empty and loading",
    description:
      "An empty list shows its `emptyState`; while `isLoading` a spinner named by `loadingLabel` sits under the rows.",
    emptyLabel: "Archived orders",
    emptyTitle: "No archived orders",
    emptyBody: "Orders you archive will appear here.",
    loadingLabel: "Orders, loading more",
    loading: "Loading more orders",
  },
  selection: {
    title: "Selection",
    description:
      "`selectionMode`: pressing a row selects it, one at a time or several; a selected row shows a check.",
    single: "Delivery speed",
    multiple: "Gift options",
    chosen: (keys: readonly string[]) => `Chosen: ${keys.length === 0 ? "none" : keys.join(", ")}`,
  },
} as const;

/** The rows of the basic list. */
const ORDERS: readonly ListItemData[] = [
  { id: "1042", title: "Order 1042", description: "Shipped on Monday" },
  { id: "1043", title: "Order 1043", description: "Waiting for payment" },
  { id: "1044", title: "Order 1044" },
];

/** The rows with a leading avatar or icon, trailing content and a chevron. */
const TEAM: readonly ListItemData[] = [
  {
    id: "ada",
    title: "Ada Lovelace",
    description: "ada@example.com",
    startIcon: <Avatar name="Ada Lovelace" size="sm" />,
    endContent: <Chip size="sm">{STRINGS.rows.owner}</Chip>,
    hasChevron: true,
  },
  {
    id: "grace",
    title: "Grace Hopper",
    description: "grace@example.com",
    startIcon: <Avatar name="Grace Hopper" size="sm" />,
    endContent: <Chip size="sm">{STRINGS.rows.admin}</Chip>,
    hasChevron: true,
  },
  { id: "alerts", title: "Notifications", startIcon: "bell", endContent: "On", hasChevron: true },
];

/** The rows of the selection samples. */
const SPEEDS: readonly ListItemData[] = [
  { id: "standard", title: "Standard", description: "Three to five days" },
  { id: "express", title: "Express", description: "Next working day" },
  { id: "pickup", title: "Pickup", description: "Ready in an hour" },
];

/** The rows of the multiple-selection sample. */
const GIFTS: readonly ListItemData[] = [
  { id: "wrap", title: "Gift wrap" },
  { id: "note", title: "Handwritten note" },
  { id: "receipt", title: "Hide the price" },
];

/** The List page: one section per option, in a scrollable screen. */
export function ListScreen() {
  const [opened, setOpened] = useState<string | null>(null);
  const [speed, setSpeed] = useState<readonly string[]>(["express"]);
  const [gifts, setGifts] = useState<readonly string[]>([]);

  const projects: readonly ListItemData[] = [
    { id: "atlas", title: "Atlas", onPress: () => setOpened("Atlas") },
    { id: "borealis", title: "Borealis", onPress: () => setOpened("Borealis") },
    {
      id: "archived",
      title: "Archived",
      description: "Read only",
      onPress: () => setOpened("Archived"),
      isDisabled: true,
    },
  ];

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <List label={STRINGS.basics.label} items={ORDERS} />
      </Section>

      <Section title={STRINGS.rows.title} description={STRINGS.rows.description}>
        <List label={STRINGS.rows.label} items={TEAM} />
      </Section>

      <Section title={STRINGS.press.title} description={STRINGS.press.description}>
        <List label={STRINGS.press.label} items={projects} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.press.pressed(opened)}
        </Text>
      </Section>

      <Section title={STRINGS.surfaces.title} description={STRINGS.surfaces.description}>
        {SurfaceVariant.map((variant) => (
          <List
            key={variant}
            label={STRINGS.surfaces.label(variant)}
            items={ORDERS.slice(0, 2)}
            variant={variant}
          />
        ))}
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <List
          label={STRINGS.states.emptyLabel}
          items={[]}
          emptyState={
            <EmptyState
              headingLevel={3}
              title={STRINGS.states.emptyTitle}
              description={STRINGS.states.emptyBody}
            />
          }
        />
        <List
          label={STRINGS.states.loadingLabel}
          items={ORDERS.slice(0, 2)}
          isLoading
          loadingLabel={STRINGS.states.loading}
        />
      </Section>

      <Section title={STRINGS.selection.title} description={STRINGS.selection.description}>
        <List
          label={STRINGS.selection.single}
          items={SPEEDS}
          selectionMode="single"
          selectedKeys={speed}
          onSelectionChange={setSpeed}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.selection.chosen(speed)}
        </Text>
        <List
          label={STRINGS.selection.multiple}
          items={GIFTS}
          selectionMode="multiple"
          selectedKeys={gifts}
          onSelectionChange={setGifts}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.selection.chosen(gifts)}
        </Text>
      </Section>
    </Screen>
  );
}
