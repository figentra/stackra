/**
 * Stackra file contract:
 * Purpose: the page of the section route: the parts one at a time (title only, a description, a body, a start slot,
 *          every part), the actions (one primary, three shown, six of which three overflow into the menu, a danger and a
 *          disabled action, a link action), two sections with the same title told apart by `label`, an Arabic section in
 *          a right-to-left block, and a live section whose primary action switches it between viewing and editing, with
 *          the overflow menu reporting the entry chosen, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language carries
 *           its own `lang`. The page's own `h1` is a Heading; the samples are level-3 headings under the sections'
 *           level-2 headings, so the page keeps its one `h1` and no skipped level (the default level 2 is covered by the
 *           unit tests). Every sample's title is unique, so each region has its own name (axe `landmark-unique`), and
 *           the two that share a title are named by `label`. The page adds the icons it draws beyond the playground
 *           registry through a registry of its own.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0314; ADR 0060 (right-to-left); WCAG 2.2
 *          SC 1.3.1, 2.4.6, 2.5.8 and 4.1.3.
 */
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { Ellipsis } from "@stackra/icons/react/lucide-icons";
import type { MenuLeafItem } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { SectionRoute } from "#src/routes/section/section.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::section.*` keys.
const STRINGS = {
  documentTitle: `${SectionRoute.title} · Stackra Playground`,
  intro:
    "A section is a titled card on a detail page. It is a landmark named by its title, which is a real heading, and it can hold a line under the title, actions and a body. The first action is primary, three show as buttons and the rest go in a menu.",
  parts: "Parts",
  partsNote:
    "Only the title is required. The description, the start slot, the body and the actions are optional.",
  titleOnly: "Title only",
  description: "With a description",
  body: "With a body",
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
  names: "Names",
  namesNote:
    "A section is named by its title. Two sections with the same title are told apart by label, which names the region instead.",
  sameTitle: "Same title, told apart by label",
  arabic: "Arabic",
  arabicNote:
    "A right-to-left section: the title is at the right, the actions at the left, and the body reads from the right.",
  live: "Try it",
  liveNote:
    "Edit switches the section between viewing and editing. Choose an entry in the menu and the page reports it below.",
  titleOnlyTitle: "Notes",
  descriptionTitle: "Customer",
  descriptionLine: "Who placed the order",
  bodyTitle: "Payment",
  startTitle: "Shipping",
  everyTitle: "Order details",
  everyLine: "What the order holds",
  oneTitle: "Tags",
  threeTitle: "Documents",
  sixTitle: "Items",
  dangerTitle: "Danger zone",
  linkTitle: "Related",
  address: "Address",
  billingAddress: "Billing address",
  shippingAddress: "Shipping address",
  liveTitle: "Contact details",
  liveLine: "How to reach the customer",
  viewing: "Viewing the contact details.",
  editing: "Editing the contact details.",
  create: "Add",
  edit: "Edit",
  done: "Done",
  export: "Export",
  duplicate: "Duplicate",
  print: "Print",
  archive: "Archive",
  delete: "Delete",
  copy: "Copy",
  openApp: "Open the page header",
  moreActions: "More actions for this section",
  paid: "Paid in full on 3 March",
  placedBy: "Ada Lovelace",
  email: "Email",
  emailValue: "ada@example.com",
  phone: "Phone",
  phoneValue: "+20 100 555 0100",
  items: "Items",
  itemsValue: 3,
  actionStatus: (action: string | null) =>
    action === null ? "No action chosen." : `Action chosen: ${action}.`,
  arabicTitle: "تفاصيل الطلب",
  arabicLine: "ما يحتويه الطلب",
  arabicBody: "تم الدفع بالكامل في 3 مارس",
  arabicEdit: "تعديل",
  arabicExport: "تصدير",
} as const;

/** The icons this page draws beyond the playground registry. */
const PAGE_ICONS = defineIconRegistry({ ellipsis: Ellipsis });

/** The grid that lays the samples out in one column. */
const GRID = "grid gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { readonly caption: string; readonly children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Ui.Text tone="muted" type="small">
        {caption}
      </Ui.Text>
      {children}
    </li>
  );
}

/** `count` actions named for what a section does, the first of them creating. */
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

/** The rows of the "every part" body. */
const DETAILS = [
  { id: "email", label: STRINGS.email, value: STRINGS.emailValue },
  { id: "phone", label: STRINGS.phone, value: STRINGS.phoneValue },
  { id: "items", label: STRINGS.items, value: STRINGS.itemsValue },
] as const;

/** The Section page. */
export function Section() {
  const [isEditing, setIsEditing] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const choose = (label: string) => () => setAction(label);

  return (
    <IconRegistryProvider registry={PAGE_ICONS}>
      <article className="grid gap-10">
        <title>{STRINGS.documentTitle}</title>
        <header className="grid gap-2">
          <Ui.Heading level={1}>{SectionRoute.title}</Ui.Heading>
          <Ui.Text className="max-w-prose">
            <bdi>{STRINGS.intro}</bdi>
          </Ui.Text>
        </header>

        <PageSection id="section-parts" title={STRINGS.parts} note={STRINGS.partsNote}>
          <ul className={GRID}>
            <Sample caption={STRINGS.titleOnly}>
              <Ui.Section headingLevel={3} title={STRINGS.titleOnlyTitle} />
            </Sample>
            <Sample caption={STRINGS.description}>
              <Ui.Section
                headingLevel={3}
                title={STRINGS.descriptionTitle}
                description={STRINGS.descriptionLine}
              />
            </Sample>
            <Sample caption={STRINGS.body}>
              <Ui.Section headingLevel={3} title={STRINGS.bodyTitle}>
                <Ui.Text>{STRINGS.paid}</Ui.Text>
              </Ui.Section>
            </Sample>
            <Sample caption={STRINGS.start}>
              <Ui.Section
                headingLevel={3}
                title={STRINGS.startTitle}
                startContent={<Ui.Avatar name={STRINGS.placedBy} shape="square" />}
              />
            </Sample>
            <Sample caption={STRINGS.every}>
              <Ui.Section
                headingLevel={3}
                title={STRINGS.everyTitle}
                description={STRINGS.everyLine}
                startContent={<Ui.Avatar name={STRINGS.placedBy} shape="square" />}
                actions={actionsOf(2)}
                endContent={<Ui.StatusBadge tone="success">{STRINGS.paid}</Ui.StatusBadge>}
              >
                <Ui.PropertyList items={DETAILS} />
              </Ui.Section>
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="section-actions" title={STRINGS.actions} note={STRINGS.actionsNote}>
          <ul className={GRID}>
            <Sample caption={STRINGS.one}>
              <Ui.Section headingLevel={3} title={STRINGS.oneTitle} actions={actionsOf(1)} />
            </Sample>
            <Sample caption={STRINGS.three}>
              <Ui.Section headingLevel={3} title={STRINGS.threeTitle} actions={actionsOf(3)} />
            </Sample>
            <Sample caption={STRINGS.six}>
              <Ui.Section
                headingLevel={3}
                title={STRINGS.sixTitle}
                actions={actionsOf(6)}
                moreActionsLabel={STRINGS.moreActions}
              />
            </Sample>
            <Sample caption={STRINGS.danger}>
              <Ui.Section
                headingLevel={3}
                title={STRINGS.dangerTitle}
                actions={[
                  { id: "edit", label: STRINGS.edit },
                  { id: "archive", label: STRINGS.archive, isDisabled: true },
                  { id: "delete", label: STRINGS.delete, tone: "danger", icon: "trash" },
                ]}
              />
            </Sample>
            <Sample caption={STRINGS.link}>
              <Ui.Section
                headingLevel={3}
                title={STRINGS.linkTitle}
                actions={[{ id: "open", label: STRINGS.openApp, href: "/page-header" }]}
              />
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="section-names" title={STRINGS.names} note={STRINGS.namesNote}>
          <ul className={GRID}>
            <Sample caption={STRINGS.sameTitle}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Ui.Section
                  headingLevel={3}
                  title={STRINGS.address}
                  label={STRINGS.billingAddress}
                />
                <Ui.Section
                  headingLevel={3}
                  title={STRINGS.address}
                  label={STRINGS.shippingAddress}
                />
              </div>
            </Sample>
          </ul>
        </PageSection>

        <PageSection id="section-arabic" title={STRINGS.arabic} note={STRINGS.arabicNote}>
          <div dir="rtl" lang="ar" data-sample="arabic">
            <Ui.Section
              headingLevel={3}
              title={STRINGS.arabicTitle}
              description={STRINGS.arabicLine}
              actions={[
                { id: "edit", label: STRINGS.arabicEdit },
                { id: "export", label: STRINGS.arabicExport, icon: "download" },
              ]}
            >
              <Ui.Text>{STRINGS.arabicBody}</Ui.Text>
            </Ui.Section>
          </div>
        </PageSection>

        <PageSection id="section-live" title={STRINGS.live} note={STRINGS.liveNote}>
          <div className="grid gap-3">
            <div data-sample="live">
              <Ui.Section
                headingLevel={3}
                title={STRINGS.liveTitle}
                description={STRINGS.liveLine}
                moreActionsLabel={STRINGS.moreActions}
                actions={[
                  {
                    id: "edit",
                    label: isEditing ? STRINGS.done : STRINGS.edit,
                    onPress: () => setIsEditing((editing) => !editing),
                  },
                  { id: "copy", label: STRINGS.copy, onPress: choose(STRINGS.copy) },
                  { id: "export", label: STRINGS.export, onPress: choose(STRINGS.export) },
                  { id: "print", label: STRINGS.print, onPress: choose(STRINGS.print) },
                  { id: "archive", label: STRINGS.archive, onPress: choose(STRINGS.archive) },
                ]}
              >
                <Ui.Text data-sample="live-body">
                  {isEditing ? STRINGS.editing : STRINGS.viewing}
                </Ui.Text>
              </Ui.Section>
            </div>
            <Ui.Text role="status" tone="muted" data-sample="live-status">
              {STRINGS.actionStatus(action)}
            </Ui.Text>
          </div>
        </PageSection>
      </article>
    </IconRegistryProvider>
  );
}
