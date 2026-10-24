/**
 * Stackra file contract:
 * Purpose: the page of the property-list route: one column and two, the kinds of value (text, a number, a node, an empty
 *          value in the default and in words, zero), rows that can be copied, and a live list where a switch moves it
 *          between one and two columns and a copy shows what was copied, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The list is a description list,
 *           so each sample has a caption above it rather than a name of its own (`aria-label` on a `dl` is not allowed);
 *           the values are plain data, never real ones.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); ADR 0060
 *          (light, dark, RTL); WCAG 2.2 SC 1.3.1.
 */
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { PropertyListRoute } from "#src/routes/property-list/property-list.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::property-list.*` keys.
const STRINGS = {
  documentTitle: `${PropertyListRoute.title} · Stackra Playground`,
  intro:
    "A property list shows the label and value pairs of one record on a detail page. It is a description list for assistive technology, in one or two columns, with a dash for an empty value and an optional copy button on a value people copy.",
  columns: "Columns",
  columnsNote:
    "One column by default. Two columns sit side by side on a wide screen and stack on a narrow one.",
  oneColumn: "One column",
  twoColumns: "Two columns",
  values: "Values",
  valuesNote:
    "Text and numbers, any element, an empty value as a dash or in words, and zero, which is a value.",
  valuesDefault: "Default empty value",
  valuesCustom: "Empty value in words",
  notSet: "Not set",
  copyable: "Copyable",
  copyableNote:
    "A row with a copy label gets a copy button named by it. The button shows a check for two seconds and the list says the copied label once.",
  copyableList: "Copyable rows",
  live: "Try it",
  liveNote:
    "The switch moves the list between one and two columns. Press a copy button to copy that value.",
  twoColumnsSwitch: "Show two columns",
  copiedLabel: "Copied",
  lastCopied: "Last copied:",
  nothingCopied: "nothing yet",
  customer: "Customer",
  customerValue: "Ada Lovelace",
  email: "Email",
  emailValue: "ada@example.com",
  orderId: "Order id",
  orderIdValue: "ord_01H2J3K4L5M6N7P8Q9R0",
  copyOrderId: "Copy order id",
  copyEmail: "Copy email",
  status: "Status",
  paid: "Paid",
  items: "Items",
  note: "Note",
  phone: "Phone",
  total: "Total",
  totalValue: "EUR 128.00",
  copyTotal: "Copy total",
  totalCopyValue: "128.00",
  zeroLabel: "Open refunds",
} as const;

/** The rows the samples share. */
const DETAILS = [
  { id: "customer", label: STRINGS.customer, value: STRINGS.customerValue },
  { id: "email", label: STRINGS.email, value: STRINGS.emailValue },
  { id: "orderId", label: STRINGS.orderId, value: STRINGS.orderIdValue },
  { id: "items", label: STRINGS.items, value: 3 },
] as const;

/** The rows of the live list: copyable ids and an email, a total that copies a plain number, and an empty note. */
const LIVE_ITEMS = [
  { id: "customer", label: STRINGS.customer, value: STRINGS.customerValue },
  {
    id: "email",
    label: STRINGS.email,
    value: STRINGS.emailValue,
    copyLabel: STRINGS.copyEmail,
  },
  {
    id: "orderId",
    label: STRINGS.orderId,
    value: STRINGS.orderIdValue,
    copyLabel: STRINGS.copyOrderId,
  },
  {
    id: "total",
    label: STRINGS.total,
    value: STRINGS.totalValue,
    copyLabel: STRINGS.copyTotal,
    copyValue: STRINGS.totalCopyValue,
  },
  { id: "note", label: STRINGS.note },
] as const;

/** A list with a short caption above it, so each sample says what it shows without naming the `dl` itself. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-2">
      <Ui.Text type="caption" tone="muted">
        <bdi>{caption}</bdi>
      </Ui.Text>
      {children}
    </div>
  );
}

/** The PropertyList page. */
export function PropertyList() {
  const [hasTwoColumns, setHasTwoColumns] = useState(false);
  const [lastCopied, setLastCopied] = useState<string | undefined>(undefined);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{PropertyListRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="property-list-columns" title={STRINGS.columns} note={STRINGS.columnsNote}>
        <div className="grid gap-8">
          <Sample caption={STRINGS.oneColumn}>
            <Ui.PropertyList items={DETAILS} />
          </Sample>
          <Sample caption={STRINGS.twoColumns}>
            <Ui.PropertyList items={DETAILS} columns={2} />
          </Sample>
        </div>
      </PageSection>

      <PageSection id="property-list-values" title={STRINGS.values} note={STRINGS.valuesNote}>
        <div className="grid gap-8 sm:grid-cols-2">
          <Sample caption={STRINGS.valuesDefault}>
            <Ui.PropertyList
              items={[
                { id: "customer", label: STRINGS.customer, value: STRINGS.customerValue },
                {
                  id: "status",
                  label: STRINGS.status,
                  value: <Ui.StatusBadge tone="success">{STRINGS.paid}</Ui.StatusBadge>,
                },
                { id: "note", label: STRINGS.note },
                { id: "zero", label: STRINGS.zeroLabel, value: 0 },
              ]}
            />
          </Sample>
          <Sample caption={STRINGS.valuesCustom}>
            <Ui.PropertyList
              emptyValue={STRINGS.notSet}
              items={[
                { id: "phone", label: STRINGS.phone, value: "" },
                { id: "note", label: STRINGS.note, value: false },
              ]}
            />
          </Sample>
        </div>
      </PageSection>

      <PageSection id="property-list-copyable" title={STRINGS.copyable} note={STRINGS.copyableNote}>
        <Sample caption={STRINGS.copyableList}>
          <Ui.PropertyList
            items={[
              {
                id: "orderId",
                label: STRINGS.orderId,
                value: STRINGS.orderIdValue,
                copyLabel: STRINGS.copyOrderId,
              },
              {
                id: "email",
                label: STRINGS.email,
                value: STRINGS.emailValue,
                copyLabel: STRINGS.copyEmail,
              },
            ]}
            copiedLabel={STRINGS.copiedLabel}
          />
        </Sample>
      </PageSection>

      <PageSection id="property-list-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid max-w-3xl gap-4">
          <Ui.Switch
            label={STRINGS.twoColumnsSwitch}
            value={hasTwoColumns}
            onChange={setHasTwoColumns}
          />
          <Ui.PropertyList
            items={LIVE_ITEMS}
            columns={hasTwoColumns ? 2 : 1}
            copiedLabel={STRINGS.copiedLabel}
            onCopy={(_item, text) => setLastCopied(text)}
          />
          <Ui.Text tone="muted" data-testid="last-copied">
            <bdi>
              {STRINGS.lastCopied} {lastCopied ?? STRINGS.nothingCopied}
            </bdi>
          </Ui.Text>
        </div>
      </PageSection>
    </article>
  );
}
