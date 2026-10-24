/**
 * Stackra file contract:
 * Purpose: the page of the action-menu route: the "more actions" button with grouped actions (icons, shortcut hints,
 *          a danger action, a disabled one that says why), every button variant and size, its own icon, the disabled
 *          state, the two placements, and a live clickable row that shows a choice in the menu never opens the row,
 *          all from `@stackra/ui/react` with real props.
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
  Ellipsis,
  EllipsisVertical,
  Pencil,
  Trash,
} from "@stackra/icons/react/lucide-icons";
import { ButtonVariant, Size } from "@stackra/ui/contracts";
import type { MenuSection } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { ActionMenuRoute } from "#src/routes/action-menu/action-menu.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::action-menu.*` keys.
const STRINGS = {
  documentTitle: `${ActionMenuRoute.title} · Stackra Playground`,
  intro:
    "An action menu is the “more actions” button at the end of a row or the corner of a section. Its label names the button, since the icon alone says nothing to a screen reader.",
  basics: "Basics",
  basicsNote:
    "Grouped actions with an icon, a shortcut hint, a danger action and a disabled one that says why. The groups are named for assistive technology, with no heading drawn.",
  basicsLabel: "Actions for order 1001",
  basicsCaption: "Opens at the button's end",
  variants: "Variants and sizes",
  variantsNote:
    "One row per size, one button per variant. The default is ghost, which sits quietly in a row.",
  size: (size: string) => `Size ${size}`,
  variantLabel: (variant: string) => `Actions, ${variant}`,
  icon: "Icon",
  iconNote: "The icon is the ellipsis unless the app gives another.",
  iconLabel: "More options",
  iconCaption: "A vertical ellipsis",
  placement: "Placement",
  placementNote:
    "It opens below the button at its reading end. Another side and alignment can be asked for; it flips when there is no room.",
  placementDefaultLabel: "Actions, default placement",
  placementDefaultCaption: "Default: bottom, end",
  placementTopLabel: "Actions, above",
  placementTopCaption: 'placement="top" align="start"',
  states: "States",
  statesNote: "A disabled action menu shows the disabled style and never opens.",
  disabledLabel: "Actions, unavailable",
  disabledCaption: "Disabled",
  live: "Try it",
  liveNote:
    "The row opens when it is pressed, and Open order is its keyboard route. A press on the menu button, or on an action in the menu, never opens the row.",
  rowTitle: "Order 1001",
  openOrder: "Open order",
  rowOpened: (count: number) => `Row opened ${count} ${count === 1 ? "time" : "times"}.`,
  lastAction: (key: string | null) => `Last action: ${key ?? "none"}`,
} as const;

/** The icons the samples draw, by name; merged into the playground's own registry. */
const PAGE_ICONS = defineIconRegistry({
  archive: Archive,
  copy: Copy,
  ellipsis: Ellipsis,
  "ellipsis-vertical": EllipsisVertical,
  pencil: Pencil,
  trash: Trash,
});

/** The groups of an order's actions: editing, then the destructive ones. */
const ORDER_SECTIONS: readonly MenuSection[] = [
  {
    id: "edit",
    title: "Edit",
    isTitleHidden: true,
    items: [
      { id: "rename", label: "Rename", icon: "pencil", shortcut: "⌘R" },
      {
        id: "duplicate",
        label: "Duplicate",
        icon: "copy",
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
        icon: "archive",
        isDisabled: true,
        disabledReason: "Paid orders cannot be archived",
      },
      { id: "delete", label: "Delete", icon: "trash", tone: "danger", shortcut: "⌘Del" },
    ],
  },
];

/** A sample with its caption underneath. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid justify-items-start gap-2">
      {children}
      <Ui.Text type="small" tone="muted">
        <bdi>{caption}</bdi>
      </Ui.Text>
    </li>
  );
}

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** The Action menu page. */
export function ActionMenu() {
  const [rowOpened, setRowOpened] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const openRow = () => setRowOpened((count) => count + 1);

  return (
    <IconRegistryProvider registry={PAGE_ICONS}>
      <article className="grid gap-10">
        <title>{STRINGS.documentTitle}</title>
        <header className="grid gap-2">
          <Ui.Heading level={1}>{ActionMenuRoute.title}</Ui.Heading>
          <Ui.Text className="max-w-prose">
            <bdi>{STRINGS.intro}</bdi>
          </Ui.Text>
        </header>

        <PageSection id="action-menu-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
          <ul className={ROW}>
            <Sample caption={STRINGS.basicsCaption}>
              <Ui.ActionMenu label={STRINGS.basicsLabel} sections={ORDER_SECTIONS} />
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="action-menu-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
          {Size.map((size) => (
            <ul key={size} aria-label={STRINGS.size(size)} className={ROW}>
              {ButtonVariant.map((variant) => (
                <Sample key={variant} caption={`${size} · ${variant}`}>
                  <Ui.ActionMenu
                    label={`${STRINGS.variantLabel(variant)}, ${size}`}
                    sections={ORDER_SECTIONS}
                    variant={variant}
                    size={size}
                  />
                </Sample>
              ))}
            </ul>
          ))}
        </PageSection>

        <PageSection id="action-menu-icon" title={STRINGS.icon} note={STRINGS.iconNote}>
          <ul className={ROW}>
            <Sample caption={STRINGS.iconCaption}>
              <Ui.ActionMenu
                label={STRINGS.iconLabel}
                sections={ORDER_SECTIONS}
                icon="ellipsis-vertical"
              />
            </Sample>
          </ul>
        </PageSection>

        <PageSection
          id="action-menu-placement"
          title={STRINGS.placement}
          note={STRINGS.placementNote}
        >
          <ul className={ROW}>
            <Sample caption={STRINGS.placementDefaultCaption}>
              <Ui.ActionMenu label={STRINGS.placementDefaultLabel} sections={ORDER_SECTIONS} />
            </Sample>
            <Sample caption={STRINGS.placementTopCaption}>
              <Ui.ActionMenu
                label={STRINGS.placementTopLabel}
                sections={ORDER_SECTIONS}
                placement="top"
                align="start"
              />
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="action-menu-states" title={STRINGS.states} note={STRINGS.statesNote}>
          <ul className={ROW}>
            <Sample caption={STRINGS.disabledCaption}>
              <Ui.ActionMenu label={STRINGS.disabledLabel} sections={ORDER_SECTIONS} isDisabled />
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="action-menu-live" title={STRINGS.live} note={STRINGS.liveNote}>
          <Ui.Surface
            variant="secondary"
            className="flex items-center justify-between gap-4 rounded-2xl p-3"
            // A press on the row's own text opens it; a button inside counts its own press, so none counts twice.
            onClick={(event) => {
              if (!(event.target as HTMLElement).closest("button")) openRow();
            }}
          >
            <Ui.Text>{STRINGS.rowTitle}</Ui.Text>
            <div className="flex items-center gap-2">
              <Ui.Button variant="tertiary" onPress={openRow}>
                {STRINGS.openOrder}
              </Ui.Button>
              <Ui.ActionMenu
                label={STRINGS.basicsLabel}
                sections={ORDER_SECTIONS}
                onAction={setLastAction}
              />
            </div>
          </Ui.Surface>
          <Ui.Text role="status" data-testid="action-menu-row-opened" tone="muted">
            {STRINGS.rowOpened(rowOpened)}
          </Ui.Text>
          <Ui.Text role="status" data-testid="action-menu-last-action" tone="muted">
            {STRINGS.lastAction(lastAction)}
          </Ui.Text>
        </PageSection>
      </article>
    </IconRegistryProvider>
  );
}
