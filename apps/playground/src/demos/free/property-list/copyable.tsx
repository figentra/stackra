/**
 * Stackra file contract:
 * Purpose: the "copyable" demo of the web Property list: A row with a copy label gets a copy button named by it. The
 *          button shows a check for two seconds and the list says the copied label once.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.3.1.
 */
import { PropertyList as UiPropertyList, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROPERTY_LIST_KEYS } from "#src/demos/free/property-list/property-list-keys.constant";

/** The demo's keys. */
const K = PROPERTY_LIST_KEYS.property_list;

/** A list with a short caption above it, so each sample says what it shows without naming the `dl` itself. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-2">
      <Text type="caption" tone="muted">
        <bdi>{caption}</bdi>
      </Text>
      {children}
    </div>
  );
}

/** Property list: Copyable. */
export default function Copyable() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sample caption={t(K.copyable_list)}>
      <UiPropertyList
        items={[
          {
            id: "orderId",
            label: t(K.order_id),
            value: t(K.order_id_value),
            copyLabel: t(K.copy_order_id),
          },
          {
            id: "email",
            label: t(K.email),
            value: t(K.email_value),
            copyLabel: t(K.copy_email),
          },
        ]}
        copiedLabel={t(K.copied_label)}
      />
    </Sample>
  );
}
