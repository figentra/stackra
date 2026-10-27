/**
 * Stackra file contract:
 * Purpose: the page of the menu route: a menu with groups, icons, shortcut hints, a danger action and a disabled one
 *          with its reason, a plain menu, every side and alignment, single and multiple selection scoped to a group, a
 *          submenu, a link action and a disabled trigger, and a live example whose last action and open state are
 *          reported and which can be opened from outside, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The icons the samples draw are
 *          registered by a provider of the page's own, which merges into the playground's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import {
  Archive,
  Copy,
  Download,
  ExternalLink,
  Pencil,
  Trash,
} from "@stackra/icons/react/lucide-icons";
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, Heading, Menu as UiMenu, Text } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { MenuRoute } from "#src/routes/menu/menu.route";
import { Icons } from "#src/constants/icons.constant";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::menu.*` keys.
const STRINGS = {
  documentTitle: `${MenuRoute.title} · Stackra Playground`,
  intro:
    "A menu opens from a trigger and lists actions in groups. It is named by its trigger, so the trigger needs an accessible name. Choosing an action runs it and closes the menu.",
  basics: "Basics",
  basicsNote:
    "Groups with a divider between, an icon, a second line, a shortcut hint, a danger action and a disabled one that says why.",
  orderActions: "Order actions",
  orderActionsCaption: "Icons, shortcut hints, danger and disabled",
  plain: "Sort",
  plainCaption: "A plain menu: labels only",
  placement: "Placement",
  placementNote:
    "The side by reading direction (start and end follow right-to-left) and the alignment along it. The menu flips when there is no room.",
  side: (side: string) => `Side ${side}`,
  sideCaption: (side: string) => `placement="${side}"`,
  align: (align: string) => `Align ${align}`,
  alignCaption: (align: string) => `placement="bottom" align="${align}"`,
  itemOne: "First action",
  itemTwo: "Second action",
  selection: "Selection",
  selectionNote:
    "Selection is scoped to a group: single keeps one choice per group, multiple keeps any number. The chosen keys are one list.",
  singleTrigger: "Sort orders",
  singleCaption: "Single, one choice per group",
  multipleTrigger: "Columns",
  multipleCaption: "Multiple",
  chosen: (keys: readonly string[]) => `Chosen: ${keys.length ? keys.join(", ") : "none"}`,
  submenu: "Submenu",
  submenuNote:
    "An action with items opens a second menu to its reading end. It nests one level; a deeper choice is a second screen.",
  fileTrigger: "File",
  fileCaption: "An action that opens a submenu",
  states: "States",
  statesNote:
    "A link action follows its href. A disabled trigger never opens, and a disabled action is shown but refused.",
  linkTrigger: "Go to",
  linkCaption: "A link action",
  disabledTrigger: "Disabled menu",
  disabledCaption: "Disabled trigger",
  live: "Try it",
  liveNote:
    "Choose an action and the page reports its key. The open state is the page's own: Open the menu opens it from outside.",
  liveTrigger: "Order menu",
  lastAction: (key: string | null) => `Last action: ${key ?? "none"}`,
  openState: (isOpen: boolean) => `The menu is ${isOpen ? "open" : "closed"}.`,
  openFromOutside: "Open the menu",
} as const;

/** The icons the samples draw, by name; merged into the playground's own registry. */
const PAGE_ICONS = defineIconRegistry({
  archive: Archive,
  copy: Copy,
  download: Download,
  "external-link": ExternalLink,
  pencil: Pencil,
  trash: Trash,
});

/** The groups of the first sample: editing, then the destructive ones with no visible heading. */
const ORDER_SECTIONS: readonly MenuSection[] = [
  {
    id: "edit",
    title: "Edit",
    items: [
      { id: "rename", label: "Rename", icon: Icons.Pencil, shortcut: "⌘R" },
      {
        id: "duplicate",
        label: "Duplicate",
        icon: Icons.Copy,
        shortcut: "⌘D",
        description: "Make a copy of the order",
      },
    ],
  },
  {
    id: "danger",
    title: "Danger zone",
    isTitleHidden: true,
    items: [
      {
        id: "archive",
        label: "Archive",
        icon: Icons.Archive,
        isDisabled: true,
        disabledReason: "Paid orders cannot be archived",
      },
      { id: "delete", label: "Delete", icon: Icons.Trash, tone: "danger", shortcut: "⌘Del" },
    ],
  },
];

/** A plain menu: one group of labels. */
const PLAIN_SECTIONS: readonly MenuSection[] = [
  {
    id: "sort",
    title: "Sort",
    isTitleHidden: true,
    items: [
      { id: "newest", label: "Newest first" },
      { id: "oldest", label: "Oldest first" },
    ],
  },
];

/** Two actions, for the placement samples. */
const TWO_ACTIONS: readonly MenuSection[] = [
  {
    id: "actions",
    title: "Actions",
    isTitleHidden: true,
    items: [
      { id: "one", label: STRINGS.itemOne },
      { id: "two", label: STRINGS.itemTwo },
    ],
  },
];

/** Two groups with one choice each: the order and the field to sort by. */
const SORT_SECTIONS: readonly MenuSection[] = [
  {
    id: "order",
    title: "Order",
    items: [
      { id: "asc", label: "Ascending" },
      { id: "desc", label: "Descending" },
    ],
  },
  {
    id: "by",
    title: "Sort by",
    items: [
      { id: "name", label: "Name" },
      { id: "date", label: "Date" },
      { id: "total", label: "Total" },
    ],
  },
];

/** One group of columns, any of which can show. */
const COLUMN_SECTIONS: readonly MenuSection[] = [
  {
    id: "columns",
    title: "Columns",
    items: [
      { id: "id", label: "Order number" },
      { id: "customer", label: "Customer" },
      { id: "total", label: "Total" },
      { id: "status", label: "Status" },
    ],
  },
];

/** A menu with a submenu under Export. */
const FILE_SECTIONS: readonly MenuSection[] = [
  {
    id: "file",
    title: "File",
    isTitleHidden: true,
    items: [
      {
        id: "export",
        label: "Export",
        icon: Icons.Download,
        items: [
          { id: "pdf", label: "As PDF" },
          { id: "csv", label: "As CSV" },
        ],
      },
      { id: "print", label: "Print" },
    ],
  },
];

/** A menu whose first action is a link. */
const LINK_SECTIONS: readonly MenuSection[] = [
  {
    id: "go",
    title: "Go",
    isTitleHidden: true,
    items: [
      { id: "type", label: "Typography page", icon: Icons.ExternalLink, href: "/typography" },
      { id: "stay", label: "Stay here" },
    ],
  },
];

/** The sides of the placement samples. */
const SIDES = ["top", "bottom", "start", "end"] as const;

/** The alignments of the placement samples. */
const ALIGNS = ["start", "center", "end"] as const;

/** A sample with its caption underneath. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid justify-items-start gap-2">
      {children}
      <Text type="small" tone="muted">
        <bdi>{caption}</bdi>
      </Text>
    </li>
  );
}

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** The Menu page. */
export function Menu() {
  const [sort, setSort] = useState<readonly string[]>(["desc", "date"]);
  const [columns, setColumns] = useState<readonly string[]>(["id", "customer"]);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <IconRegistryProvider registry={PAGE_ICONS}>
      <article className="grid gap-10">
        <title>{STRINGS.documentTitle}</title>
        <header className="grid gap-2">
          <Heading level={1}>{MenuRoute.title}</Heading>
          <Text className="max-w-prose">
            <bdi>{STRINGS.intro}</bdi>
          </Text>
        </header>

        <PageSection id="menu-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
          <ul className={ROW}>
            <Sample caption={STRINGS.orderActionsCaption}>
              <UiMenu sections={ORDER_SECTIONS}>
                <Button variant="secondary">{STRINGS.orderActions}</Button>
              </UiMenu>
            </Sample>
            <Sample caption={STRINGS.plainCaption}>
              <UiMenu sections={PLAIN_SECTIONS}>
                <Button variant="secondary">{STRINGS.plain}</Button>
              </UiMenu>
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="menu-placement" title={STRINGS.placement} note={STRINGS.placementNote}>
          <ul className={ROW}>
            {SIDES.map((side) => (
              <Sample key={side} caption={STRINGS.sideCaption(side)}>
                <UiMenu sections={TWO_ACTIONS} placement={side}>
                  <Button variant="tertiary">{STRINGS.side(side)}</Button>
                </UiMenu>
              </Sample>
            ))}
            {ALIGNS.map((align) => (
              <Sample key={align} caption={STRINGS.alignCaption(align)}>
                <UiMenu sections={TWO_ACTIONS} placement="bottom" align={align}>
                  <Button variant="tertiary">{STRINGS.align(align)}</Button>
                </UiMenu>
              </Sample>
            ))}
          </ul>
        </PageSection>

        <PageSection id="menu-selection" title={STRINGS.selection} note={STRINGS.selectionNote}>
          <ul className={ROW}>
            <Sample caption={STRINGS.singleCaption}>
              <UiMenu
                sections={SORT_SECTIONS}
                selectionMode="single"
                value={sort}
                onChange={setSort}
              >
                <Button variant="secondary">{STRINGS.singleTrigger}</Button>
              </UiMenu>
              <Text role="status" data-testid="menu-single-chosen" tone="muted">
                {STRINGS.chosen(sort)}
              </Text>
            </Sample>
            <Sample caption={STRINGS.multipleCaption}>
              <UiMenu
                sections={COLUMN_SECTIONS}
                selectionMode="multiple"
                value={columns}
                onChange={setColumns}
              >
                <Button variant="secondary">{STRINGS.multipleTrigger}</Button>
              </UiMenu>
              <Text role="status" data-testid="menu-multiple-chosen" tone="muted">
                {STRINGS.chosen(columns)}
              </Text>
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="menu-submenu" title={STRINGS.submenu} note={STRINGS.submenuNote}>
          <ul className={ROW}>
            <Sample caption={STRINGS.fileCaption}>
              <UiMenu sections={FILE_SECTIONS}>
                <Button variant="secondary">{STRINGS.fileTrigger}</Button>
              </UiMenu>
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="menu-states" title={STRINGS.states} note={STRINGS.statesNote}>
          <ul className={ROW}>
            <Sample caption={STRINGS.linkCaption}>
              <UiMenu sections={LINK_SECTIONS}>
                <Button variant="secondary">{STRINGS.linkTrigger}</Button>
              </UiMenu>
            </Sample>
            <Sample caption={STRINGS.disabledCaption}>
              <UiMenu sections={PLAIN_SECTIONS}>
                <Button variant="secondary" isDisabled>
                  {STRINGS.disabledTrigger}
                </Button>
              </UiMenu>
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="menu-live" title={STRINGS.live} note={STRINGS.liveNote}>
          <div className={ROW}>
            <UiMenu
              sections={ORDER_SECTIONS}
              isOpen={isOpen}
              onOpenChange={setIsOpen}
              onAction={setLastAction}
            >
              <Button variant="secondary">{STRINGS.liveTrigger}</Button>
            </UiMenu>
            <Button variant="tertiary" onPress={() => setIsOpen(true)}>
              {STRINGS.openFromOutside}
            </Button>
          </div>
          <Text role="status" data-testid="menu-last-action" tone="muted">
            {STRINGS.lastAction(lastAction)}
          </Text>
          <Text role="status" data-testid="menu-open-state" tone="muted">
            {STRINGS.openState(isOpen)}
          </Text>
        </PageSection>
      </article>
    </IconRegistryProvider>
  );
}
