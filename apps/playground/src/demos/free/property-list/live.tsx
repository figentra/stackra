/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Property list: The switch moves the list between one and two columns. Press a
 *          copy button to copy that value.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.3.1.
 */
import { PropertyList as UiPropertyList, Switch, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROPERTY_LIST_KEYS } from "#src/demos/free/property-list/property-list-keys.constant";

/** The demo's keys. */
const K = PROPERTY_LIST_KEYS.property_list;

/** Property list: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The rows of the live list: copyable ids and an email, a total that copies a plain number, and an empty note. */
  const LIVE_ITEMS = [
    { id: "customer", label: t(K.customer), value: t(K.customer_value) },
    {
      id: "email",
      label: t(K.email),
      value: t(K.email_value),
      copyLabel: t(K.copy_email),
    },
    {
      id: "orderId",
      label: t(K.order_id),
      value: t(K.order_id_value),
      copyLabel: t(K.copy_order_id),
    },
    {
      id: "total",
      label: t(K.total),
      value: t(K.total_value),
      copyLabel: t(K.copy_total),
      copyValue: t(K.total_copy_value),
    },
    { id: "note", label: t(K.note) },
  ] as const;
  const [hasTwoColumns, setHasTwoColumns] = useState(false);

  const [lastCopied, setLastCopied] = useState<string | undefined>(undefined);

  return (
    <div className="grid max-w-3xl gap-4">
      <Switch label={t(K.two_columns_switch)} value={hasTwoColumns} onChange={setHasTwoColumns} />
      <UiPropertyList
        items={LIVE_ITEMS}
        columns={hasTwoColumns ? 2 : 1}
        copiedLabel={t(K.copied_label)}
        onCopy={(_item, text) => setLastCopied(text)}
      />
      <Text tone="muted" data-testid="last-copied">
        <bdi>
          {t(K.last_copied)} {lastCopied ?? t(K.nothing_copied)}
        </bdi>
      </Text>
    </div>
  );
}
