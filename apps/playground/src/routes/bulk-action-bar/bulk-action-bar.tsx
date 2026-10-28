/**
 * Stackra file contract:
 * Purpose: the page of the bulk action bar route: the bar with one, several and no selected record; with one, two and
 *          three actions and a danger one; with a disabled action and its reason; with the choice to select all
 *          matching records and with that choice made; and a live example over a list of orders, where an action takes
 *          a moment and shows itself busy, one fails and leaves the selection, and an emptied selection moves focus on, all from
 *          `@stackra/ui/react` with real props. A table with a selection draws this bar itself: see the data table page.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The static bars take plain
 *           numbers, never a selection of their own; the live example keeps its selection in the page, as an app does,
 *           because the bar never changes it. A failing action rejects on purpose.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0318 (decisions 4 to 6); ADR 0139; ADR 0060
 *          (light, dark, RTL); WCAG 2.2 SC 2.4.3, 4.1.3.
 */
import type { ResourceAction } from "@stackra/ui/contracts";
import type { BulkActionBarProps } from "@stackra/ui/react";
import { BulkActionBar as UiBulkActionBar, CheckboxGroup, Heading, Text } from "@stackra/ui/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { BulkActionBarRoute } from "#src/routes/bulk-action-bar/bulk-action-bar.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::bulk-action-bar.*` keys.
const STRINGS = {
  documentTitle: `${BulkActionBarRoute.title} · Stackra Playground`,
  intro:
    "A bulk action bar appears while records are selected. It shows how many, lists the actions that act on them, and clears the selection. It never changes the selection itself: the page does, after an action succeeds. The count is announced politely each time it changes. On a phone it is a bottom bar whose later actions open in a sheet.",
  counts: "Counts",
  countsNote:
    "One record, several, and none: with none the bar draws nothing, and only its status waits for the next count.",
  one: "One selected",
  several: "Three selected",
  nothing: "Nothing selected",
  actions: "Actions",
  actionsNote:
    "Each action is a button; the first is the primary one. A danger action is coloured as such. A disabled action is refused by every input and says why in its name.",
  oneAction: "One action",
  threeActions: "Three actions",
  disabledAction: "A disabled action",
  matching: "Select all matching",
  matchingNote:
    "When every record on screen is selected and the server says how many match, the bar offers all of them. Choosing it makes the total the count, and the same button goes back to the rows shown.",
  offered: "The choice is offered",
  chosen: "All matching chosen",
  barLabel: (name: string) => `Actions, ${name}`,
  live: "Try it",
  liveNote:
    "Pick some orders. Archive takes a moment and shows itself busy, then clears the selection. Delete fails and leaves the selection as it was. Emptying the selection moves focus to the list.",
  liveLabel: "Orders, live",
  liveList: "Orders to act on",
  selected: (keys: readonly string[]) =>
    `Selected: ${keys.length === 0 ? "none" : keys.join(", ")}`,
  lastAction: (text: string) => `Last action: ${text}`,
  none: "none",
  archive: "Archive",
  export: "Export",
  delete: "Delete",
  refund: "Refund",
  refundReason: "Paid orders stay",
  working: "Archive running",
  done: (name: string) => `${name} done`,
  failed: (name: string) => `${name} failed`,
  failure: "The order service did not answer.",
} as const;

/** The orders of the live example. */
const ORDERS = [
  { value: "ord-1001", label: "Order #1001" },
  { value: "ord-1002", label: "Order #1002" },
  { value: "ord-1003", label: "Order #1003" },
  { value: "ord-1004", label: "Order #1004" },
  { value: "ord-1005", label: "Order #1005" },
] as const;

/** How long a fake action takes, so the busy state can be seen and tested. */
const DELAY = 1000;

/** Does nothing: a sample whose selection never changes. */
const ignore = () => undefined;

/** Waits for `ms` milliseconds. */
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** The actions of the static samples: they do nothing, as the samples only show their look. */
const ONE: readonly ResourceAction[] = [{ id: "archive", label: STRINGS.archive, onPress: ignore }];
const THREE: readonly ResourceAction[] = [
  { id: "archive", label: STRINGS.archive, onPress: ignore },
  { id: "export", label: STRINGS.export, onPress: ignore },
  { id: "delete", label: STRINGS.delete, tone: "danger", onPress: ignore },
];
const DISABLED: readonly ResourceAction[] = [
  { id: "archive", label: STRINGS.archive, onPress: ignore },
  {
    id: "refund",
    label: STRINGS.refund,
    isDisabled: true,
    disabledReason: STRINGS.refundReason,
    onPress: ignore,
  },
];

/** A captioned sample: a small heading over what it shows. */
function Sample({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Heading level={3}>{title}</Heading>
      {children}
    </div>
  );
}

/** A bar of the static samples, named after the sample. */
function Static({ name, ...props }: { readonly name: string } & Partial<BulkActionBarProps>) {
  return (
    <UiBulkActionBar
      selectedCount={3}
      actions={THREE}
      onClearSelection={ignore}
      label={STRINGS.barLabel(name)}
      {...props}
    />
  );
}

/** The live example: a list of orders, a selection kept by the page and a bar with a slow and a failing action. */
function LiveExample() {
  const [selected, setSelected] = useState<readonly string[]>(["ord-1002", "ord-1003"]);
  const [last, setLast] = useState<string>(STRINGS.none);
  // Focus lands here when the bar goes, so a keyboard user is not dropped at the top of the page (WCAG 2.4.3).
  const region = useRef<HTMLDivElement>(null);
  const previousCount = useRef(selected.length);
  useEffect(() => {
    // The bar unmounts when the selection empties; if it held focus (the clear button, or an action that cleared the
    // selection), the browser drops it on the body, so it moves to the example instead.
    if (
      previousCount.current > 0 &&
      selected.length === 0 &&
      document.activeElement === document.body
    )
      region.current?.focus({ preventScroll: true });
    previousCount.current = selected.length;
  }, [selected.length]);

  const actions: readonly ResourceAction[] = [
    {
      id: "archive",
      label: STRINGS.archive,
      onPress: async () => {
        setLast(STRINGS.working);
        await delay(DELAY);
        setLast(STRINGS.done(STRINGS.archive));
        setSelected([]);
      },
    },
    {
      id: "delete",
      label: STRINGS.delete,
      tone: "danger",
      onPress: async () => {
        await delay(DELAY);
        setLast(STRINGS.failed(STRINGS.delete));
        throw new Error(STRINGS.failure);
      },
    },
  ];

  return (
    <div
      ref={region}
      tabIndex={-1}
      data-testid="bulk-action-bar-live"
      className="grid gap-3 outline-none"
    >
      <CheckboxGroup
        label={STRINGS.liveList}
        options={ORDERS}
        value={selected}
        onChange={setSelected}
      />
      <UiBulkActionBar
        label={STRINGS.liveLabel}
        selectedCount={selected.length}
        actions={actions}
        onClearSelection={() => setSelected([])}
      />
      <Text role="status" data-testid="bulk-action-bar-selected" tone="muted">
        {STRINGS.selected(selected)}
      </Text>
      <Text role="status" data-testid="bulk-action-bar-last" tone="muted">
        {STRINGS.lastAction(last)}
      </Text>
    </div>
  );
}

/** The select-all-matching sample: the page keeps the flag, as a table's page does. */
function MatchingExample() {
  const [isAll, setIsAll] = useState(false);
  return (
    <Static
      name={STRINGS.matching}
      selectedCount={20}
      isPageSelected
      totalCount={245}
      isAllMatchingSelected={isAll}
      onAllMatchingSelectedChange={setIsAll}
    />
  );
}

/** The BulkActionBar page. */
export function BulkActionBar() {
  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{BulkActionBarRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="bulk-action-bar-counts" title={STRINGS.counts} note={STRINGS.countsNote}>
        <Sample title={STRINGS.one}>
          <Static name={STRINGS.one} selectedCount={1} actions={ONE} />
        </Sample>
        <Sample title={STRINGS.several}>
          <Static name={STRINGS.several} />
        </Sample>
        <Sample title={STRINGS.nothing}>
          <Static name={STRINGS.nothing} selectedCount={0} />
        </Sample>
      </PageSection>

      <PageSection id="bulk-action-bar-actions" title={STRINGS.actions} note={STRINGS.actionsNote}>
        <Sample title={STRINGS.oneAction}>
          <Static name={STRINGS.oneAction} actions={ONE} />
        </Sample>
        <Sample title={STRINGS.threeActions}>
          <Static name={STRINGS.threeActions} />
        </Sample>
        <Sample title={STRINGS.disabledAction}>
          <Static name={STRINGS.disabledAction} actions={DISABLED} />
        </Sample>
      </PageSection>

      <PageSection
        id="bulk-action-bar-matching"
        title={STRINGS.matching}
        note={STRINGS.matchingNote}
      >
        <Sample title={STRINGS.offered}>
          <MatchingExample />
        </Sample>
        <Sample title={STRINGS.chosen}>
          <Static
            name={STRINGS.chosen}
            selectedCount={20}
            isPageSelected
            totalCount={245}
            isAllMatchingSelected
            onAllMatchingSelectedChange={ignore}
          />
        </Sample>
      </PageSection>

      <PageSection id="bulk-action-bar-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <LiveExample />
      </PageSection>
    </article>
  );
}
