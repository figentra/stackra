/**
 * Stackra file contract:
 * Purpose: the page of the list route: plain rows with a title and description, every slot (start icon, avatar, end
 *          content, chevron), every surface level, pressable and disabled rows, one and several selection, the empty
 *          and loading states, and three live examples (press a row, select rows, scroll to load more), all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The empty state is a plain text
 *          node here: the EmptyState component has its own page, and a list takes any node.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0313; ADR 0060 (light, dark, RTL).
 */
import { SurfaceVariant } from "@stackra/ui/contracts";
import { Avatar, Chip, Heading, List as UiList, Text } from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";

import { PageSection } from "#src/components/page-section";
import { ListRoute } from "#src/routes/list/list.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::list.*` keys.
const STRINGS = {
  documentTitle: `${ListRoute.title} · Stackra Playground`,
  intro:
    "A list draws its items as rows: a title, an optional description, a start icon or avatar, content at the end and a chevron. Without a selection mode it is a plain list; with one it is a list box. It never sorts or fetches: the query that fed it did, and it reports when its end is reached.",
  basics: "Basics",
  basicsNote: "Rows of text only: a title, and a title with a description.",
  basicsLabel: "Recent orders",
  slots: "Slots",
  slotsNote:
    "A start icon by name, an avatar as the start element, end content such as a chip or a value, and a chevron.",
  slotsLabel: "Team",
  surfaces: "Surfaces",
  surfacesNote: "The surface level the rows sit on.",
  surface: (level: string) => `Surface ${level}`,
  press: "Pressable rows",
  pressNote:
    "A row with a press action is a button. A disabled one is dimmed and refuses the press. A row without a press action is plain content.",
  pressLabel: "Account settings",
  disabledLabel: "Disabled rows",
  selection: "Selection",
  selectionNote:
    "One keeps a single row selected and pressing it again clears it; several toggles each row. A row selects or acts, never both.",
  singleLabel: "One selected",
  multipleLabel: "Several selected",
  states: "Empty and loading",
  statesNote:
    "An empty list shows what the page gives it. A loading list is busy and names one spinner, and the rows stay while the next page loads.",
  emptyLabel: "Empty list",
  empty: "No orders yet.",
  loadingLabel: "Loading list",
  loading: "Loading orders",
  livePress: "Try pressing",
  livePressNote: "Press a row; the page reports which one.",
  liveSelect: "Try selecting",
  liveSelectNote: "Select rows; the page reports the ids in the order of the rows.",
  liveSelectLabel: "Notification channels",
  liveMore: "Try loading more",
  liveMoreNote:
    "Scroll the box to its end; the list reports it and the page adds five rows after a short wait, up to fifteen.",
  liveMoreLabel: "Activity",
  scrollRegion: "Scrollable activity rows",
  pressed: (title: string) => `Pressed: ${title}`,
  nonePressed: "Pressed: none",
  selected: (keys: readonly string[]) =>
    `Selected: ${keys.length === 0 ? "none" : keys.join(", ")}`,
  rows: (count: number) => `${count} rows`,
} as const;

/** The rows of the basic list. */
const ORDERS = [
  { id: "1042", title: "Order 1042", description: "Shipped on Monday" },
  { id: "1043", title: "Order 1043", description: "Waiting for payment" },
  { id: "1044", title: "Order 1044" },
] as const;

/** Rows with every slot. */
const TEAM = [
  {
    id: "ada",
    title: "Ada Lovelace",
    description: "Engineering",
    startIcon: <Avatar name="Ada Lovelace" size="sm" />,
    endContent: (
      <Chip size="sm" tone="success">
        Active
      </Chip>
    ),
    hasChevron: true,
  },
  {
    id: "office",
    title: "Head office",
    description: "Cairo",
    startIcon: "building",
    endContent: "12 people",
    hasChevron: true,
  },
  { id: "alerts", title: "Alerts", startIcon: "bell", endContent: "3 new" },
] as const;

/** The three channels of the selection samples. */
const CHANNELS = [
  { id: "email", title: "Email", description: "Daily summary", startIcon: "bell" },
  { id: "push", title: "Push", description: "As it happens", startIcon: "bell" },
  { id: "sms", title: "SMS", description: "Urgent only", startIcon: "bell", isDisabled: true },
  { id: "chat", title: "Chat", description: "Mentions", startIcon: "bell" },
] as const;

/** The activity rows, five at a time. */
const activityRows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `activity-${index + 1}`,
    title: `Activity ${index + 1}`,
    description: "A moment ago",
  }));

/** How many rows one page of activity holds, and how many there are in all. */
const PAGE = 5;
const TOTAL = 15;

/** The List page. */
export function List() {
  const [pressed, setPressed] = useState<string | undefined>(undefined);
  const [channels, setChannels] = useState<readonly string[]>(["email"]);
  const [activity, setActivity] = useState(PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A pending load is dropped with the page, so it cannot set state after the page is gone.
  useEffect(() => () => clearTimeout(timer.current), []);

  const loadMore = () => {
    setIsLoadingMore(true);
    timer.current = setTimeout(() => {
      setActivity((count) => Math.min(count + PAGE, TOTAL));
      setIsLoadingMore(false);
    }, 400);
  };

  const press = (title: string) => () => setPressed(title);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{ListRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="list-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <UiList label={STRINGS.basicsLabel} items={ORDERS} />
      </PageSection>

      <PageSection id="list-slots" title={STRINGS.slots} note={STRINGS.slotsNote}>
        <UiList label={STRINGS.slotsLabel} items={TEAM} />
      </PageSection>

      <PageSection id="list-surfaces" title={STRINGS.surfaces} note={STRINGS.surfacesNote}>
        <div className="grid gap-4 sm:grid-cols-2">
          {SurfaceVariant.map((variant) => (
            <UiList
              key={variant}
              label={STRINGS.surface(variant)}
              variant={variant}
              items={ORDERS.slice(0, 2)}
            />
          ))}
        </div>
      </PageSection>

      <PageSection id="list-press" title={STRINGS.press} note={STRINGS.pressNote}>
        <div className="grid gap-4 sm:grid-cols-2">
          <UiList
            label={STRINGS.pressLabel}
            items={[
              {
                id: "profile",
                title: "Profile",
                startIcon: "settings",
                hasChevron: true,
                onPress: () => undefined,
              },
              {
                id: "billing",
                title: "Billing",
                description: "Plans and invoices",
                hasChevron: true,
                onPress: () => undefined,
              },
            ]}
          />
          <UiList
            label={STRINGS.disabledLabel}
            items={[
              {
                id: "profile",
                title: "Profile, disabled",
                onPress: () => undefined,
                isDisabled: true,
              },
              {
                id: "billing",
                title: "Billing, disabled",
                hasChevron: true,
                onPress: () => undefined,
                isDisabled: true,
              },
            ]}
          />
        </div>
      </PageSection>

      <PageSection id="list-selection" title={STRINGS.selection} note={STRINGS.selectionNote}>
        <div className="grid gap-4 sm:grid-cols-2">
          <UiList
            label={STRINGS.singleLabel}
            items={CHANNELS}
            selectionMode="single"
            defaultSelectedKeys={["push"]}
          />
          <UiList
            label={STRINGS.multipleLabel}
            items={CHANNELS}
            selectionMode="multiple"
            defaultSelectedKeys={["email", "chat"]}
          />
        </div>
      </PageSection>

      <PageSection id="list-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className="grid gap-4 sm:grid-cols-2">
          <UiList
            label={STRINGS.emptyLabel}
            items={[]}
            emptyState={<Text tone="muted">{STRINGS.empty}</Text>}
          />
          <UiList
            label={STRINGS.loadingLabel}
            items={ORDERS.slice(0, 2)}
            isLoading
            loadingLabel={STRINGS.loading}
          />
        </div>
      </PageSection>

      <PageSection id="list-live-press" title={STRINGS.livePress} note={STRINGS.livePressNote}>
        <UiList
          label={STRINGS.pressLabel}
          items={ORDERS.map((order) => ({
            id: order.id,
            title: order.title,
            hasChevron: true,
            onPress: press(order.title),
          }))}
        />
        <Text role="status" tone="muted" data-testid="list-pressed">
          {pressed === undefined ? STRINGS.nonePressed : STRINGS.pressed(pressed)}
        </Text>
      </PageSection>

      <PageSection id="list-live-select" title={STRINGS.liveSelect} note={STRINGS.liveSelectNote}>
        <UiList
          label={STRINGS.liveSelectLabel}
          items={CHANNELS}
          selectionMode="multiple"
          selectedKeys={channels}
          onSelectionChange={setChannels}
        />
        <Text role="status" tone="muted" data-testid="list-selected">
          {STRINGS.selected(channels)}
        </Text>
      </PageSection>

      <PageSection id="list-live-more" title={STRINGS.liveMore} note={STRINGS.liveMoreNote}>
        {/* A scrollable box must take focus, so a keyboard user can scroll it (WCAG 2.1.1). */}
        <div
          role="region"
          aria-label={STRINGS.scrollRegion}
          tabIndex={0}
          className="h-56 overflow-y-auto"
          data-testid="list-scroll"
        >
          <UiList
            label={STRINGS.liveMoreLabel}
            items={activityRows(activity)}
            hasMore={activity < TOTAL}
            onLoadMore={loadMore}
            isLoading={isLoadingMore}
            loadingLabel={STRINGS.loading}
          />
        </div>
        <Text role="status" tone="muted" data-testid="list-count">
          {STRINGS.rows(activity)}
        </Text>
      </PageSection>
    </article>
  );
}
