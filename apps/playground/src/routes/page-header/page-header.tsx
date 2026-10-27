/**
 * Stackra file contract:
 * Purpose: the page of the page-header route: its own top is a PageHeader, the page's one `h1`; below it the parts one
 *          at a time (title only, a description, a status, a start slot, every part with a trail), the actions (one
 *          primary, three shown, six of which three overflow into the menu, a danger and a disabled action, a link
 *          action), an Arabic header in a right-to-left block, and a live header whose primary action changes the
 *          status and its own label, with the overflow menu reporting the entry chosen, all from `@stackra/ui/react`
 *          with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language carries
 *           its own `lang`. The samples are level-3 headings under the section's level-2 heading, so the page keeps its
 *           one `h1` (the header at the top) and no skipped level. Only the "every part" sample has a trail, so the
 *           page holds one Breadcrumbs landmark of that name (axe `landmark-unique`). The page adds the icons it draws
 *           beyond the playground registry through a registry of its own.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2
 *          SC 1.3.1, 2.4.6, 2.5.8 and 4.1.3.
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { Ellipsis } from "@stackra/icons/react/lucide-icons";
import type { MenuLeafItem } from "@stackra/ui/contracts";
import { Avatar, PageHeader as UiPageHeader, StatusBadge, Text } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { PageHeaderRoute } from "#src/routes/page-header/page-header.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::page-header.*` keys.
const STRINGS = {
  documentTitle: `${PageHeaderRoute.title} · Stackra Playground`,
  intro:
    "The page header is the top of a page: a breadcrumb trail, the title, a line under it, a status and the page's actions. The title is a real heading and the page's one h1. The first action is primary, three show as buttons and the rest go in a menu.",
  parts: "Parts",
  partsNote:
    "Only the title is required. The description, the status, the start slot, the trail and the actions are optional.",
  titleOnly: "Title only",
  description: "With a description",
  status: "With a status beside the title",
  start: "With a start slot",
  every: "Every part",
  actions: "Actions",
  actionsNote:
    "The first action is primary and the next two are secondary. From the fourth on, actions go in a menu named by the “more actions” label.",
  one: "One primary action",
  three: "Three actions, all shown",
  six: "Six actions: three shown, three in the menu",
  danger: "A danger action and a disabled one",
  link: "An action with an href is a link drawn as a button",
  arabic: "Arabic",
  arabicNote:
    "A right-to-left header: the title is at the right, the actions at the left, and the trail reads from the right.",
  live: "Try it",
  liveNote:
    "Mark the order as shipped: the status changes and the primary action becomes Undo shipping. Choose an entry in the menu and the page reports it below.",
  order: "Order 1042",
  placed: "Placed on 3 March by Ada Lovelace",
  paid: "Paid",
  shipped: "Shipped",
  create: "Create order",
  edit: "Edit",
  export: "Export",
  duplicate: "Duplicate",
  print: "Print",
  archive: "Archive",
  delete: "Delete",
  openApp: "Open the app header",
  markShipped: "Mark as shipped",
  undoShipping: "Undo shipping",
  moreActions: "More actions for this order",
  orders: "Orders",
  customers: "Customers",
  actionStatus: (action: string | null) =>
    action === null ? "No action chosen." : `Action chosen: ${action}.`,
  arabicTitle: "الطلب 1042",
  arabicDescription: "تم الطلب في 3 مارس بواسطة منى السالم",
  arabicPaid: "مدفوع",
  arabicEdit: "تعديل",
  arabicExport: "تصدير",
  arabicOrders: "الطلبات",
} as const;

/** The icons this page draws beyond the playground registry. */
const PAGE_ICONS = defineIconRegistry({ ellipsis: Ellipsis });

/** The card a header sits in, as the top of a page would. */
const CARD = "rounded-xl border border-border p-4";

/** The grid that lays the samples out in one column of cards. */
const GRID = "grid gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { readonly caption: string; readonly children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      <div className={CARD}>{children}</div>
    </li>
  );
}

/** `count` actions named for what a page does, the first of them creating. */
const actionsOf = (count: number): MenuLeafItem[] => {
  const all: MenuLeafItem[] = [
    { id: "create", label: STRINGS.create, icon: "plus" },
    { id: "edit", label: STRINGS.edit },
    { id: "export", label: STRINGS.export, icon: "download" },
    { id: "duplicate", label: STRINGS.duplicate, icon: "copy" },
    { id: "print", label: STRINGS.print },
    { id: "archive", label: STRINGS.archive },
  ];
  return all.slice(0, count);
};

/** The PageHeader page. */
export function PageHeader() {
  const [isShipped, setIsShipped] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const choose = (label: string) => () => setAction(label);

  return (
    <IconRegistryProvider registry={PAGE_ICONS}>
      <article className="grid gap-10">
        <title>{STRINGS.documentTitle}</title>
        <UiPageHeader
          title={PageHeaderRoute.title}
          description={<bdi>{STRINGS.intro}</bdi>}
          className="max-w-prose"
        />

        <PageSection id="page-header-parts" title={STRINGS.parts} note={STRINGS.partsNote}>
          <ul className={GRID}>
            <Sample caption={STRINGS.titleOnly}>
              <UiPageHeader headingLevel={3} title={STRINGS.order} />
            </Sample>
            <Sample caption={STRINGS.description}>
              <UiPageHeader headingLevel={3} title={STRINGS.order} description={STRINGS.placed} />
            </Sample>
            <Sample caption={STRINGS.status}>
              <UiPageHeader
                headingLevel={3}
                title={STRINGS.order}
                status={<StatusBadge tone="success">{STRINGS.paid}</StatusBadge>}
              />
            </Sample>
            <Sample caption={STRINGS.start}>
              <UiPageHeader
                headingLevel={3}
                title={STRINGS.order}
                description={STRINGS.placed}
                startContent={<Avatar name="Ada Lovelace" shape="square" />}
              />
            </Sample>
            <Sample caption={STRINGS.every}>
              <UiPageHeader
                headingLevel={3}
                breadcrumbs={[
                  { id: "orders", label: STRINGS.orders, href: "/" },
                  { id: "customers", label: STRINGS.customers, href: "/page-header" },
                  { id: "order", label: STRINGS.order },
                ]}
                title={STRINGS.order}
                description={STRINGS.placed}
                status={<StatusBadge tone="success">{STRINGS.paid}</StatusBadge>}
                startContent={<Avatar name="Ada Lovelace" shape="square" />}
                actions={actionsOf(3)}
              />
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="page-header-actions" title={STRINGS.actions} note={STRINGS.actionsNote}>
          <ul className={GRID}>
            <Sample caption={STRINGS.one}>
              <UiPageHeader headingLevel={3} title={STRINGS.order} actions={actionsOf(1)} />
            </Sample>
            <Sample caption={STRINGS.three}>
              <UiPageHeader headingLevel={3} title={STRINGS.order} actions={actionsOf(3)} />
            </Sample>
            <Sample caption={STRINGS.six}>
              <UiPageHeader
                headingLevel={3}
                title={STRINGS.order}
                actions={actionsOf(6)}
                moreActionsLabel={STRINGS.moreActions}
              />
            </Sample>
            <Sample caption={STRINGS.danger}>
              <UiPageHeader
                headingLevel={3}
                title={STRINGS.order}
                actions={[
                  { id: "edit", label: STRINGS.edit },
                  { id: "archive", label: STRINGS.archive, isDisabled: true },
                  { id: "delete", label: STRINGS.delete, tone: "danger", icon: "trash" },
                ]}
              />
            </Sample>
            <Sample caption={STRINGS.link}>
              <UiPageHeader
                headingLevel={3}
                title={STRINGS.order}
                actions={[{ id: "open", label: STRINGS.openApp, href: "/app-header" }]}
              />
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="page-header-arabic" title={STRINGS.arabic} note={STRINGS.arabicNote}>
          <div dir="rtl" lang="ar" data-sample="arabic" className={CARD}>
            <UiPageHeader
              headingLevel={3}
              title={STRINGS.arabicTitle}
              description={STRINGS.arabicDescription}
              status={<StatusBadge tone="success">{STRINGS.arabicPaid}</StatusBadge>}
              actions={[
                { id: "edit", label: STRINGS.arabicEdit },
                { id: "export", label: STRINGS.arabicExport, icon: "download" },
              ]}
            />
          </div>
        </PageSection>

        <PageSection id="page-header-live" title={STRINGS.live} note={STRINGS.liveNote}>
          <div className="grid gap-3">
            <div className={CARD} data-sample="live">
              <UiPageHeader
                headingLevel={3}
                title={STRINGS.order}
                description={STRINGS.placed}
                status={
                  <StatusBadge tone={isShipped ? "accent" : "success"}>
                    {isShipped ? STRINGS.shipped : STRINGS.paid}
                  </StatusBadge>
                }
                moreActionsLabel={STRINGS.moreActions}
                actions={[
                  {
                    id: "ship",
                    label: isShipped ? STRINGS.undoShipping : STRINGS.markShipped,
                    onPress: () => setIsShipped((shipped) => !shipped),
                  },
                  { id: "edit", label: STRINGS.edit, onPress: choose(STRINGS.edit) },
                  { id: "export", label: STRINGS.export, onPress: choose(STRINGS.export) },
                  { id: "duplicate", label: STRINGS.duplicate, onPress: choose(STRINGS.duplicate) },
                  { id: "print", label: STRINGS.print, onPress: choose(STRINGS.print) },
                ]}
              />
            </div>
            <Text role="status" tone="muted" data-sample="live-status">
              {STRINGS.actionStatus(action)}
            </Text>
          </div>
        </PageSection>
      </article>
    </IconRegistryProvider>
  );
}
