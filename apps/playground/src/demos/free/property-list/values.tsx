/**
 * Stackra file contract:
 * Purpose: the "values" demo of the web Property list: Text and numbers, any element, an empty value as a dash or in
 *          words, and zero, which is a value.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.3.1.
 */
import {
  PropertyList as UiPropertyList,
  StatusBadge,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
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

/** Property list: Values. */
export default function Values() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Sample caption={t(K.values_default)}>
        <UiPropertyList
          items={[
            { id: "customer", label: t(K.customer), value: t(K.customer_value) },
            {
              id: "status",
              label: t(K.status),
              value: <StatusBadge tone="success">{t(K.paid)}</StatusBadge>,
            },
            { id: "note", label: t(K.note) },
            { id: "zero", label: t(K.zero_label), value: 0 },
          ]}
        />
      </Sample>
      <Sample caption={t(K.values_custom)}>
        <UiPropertyList
          emptyValue={t(K.not_set)}
          items={[
            { id: "phone", label: t(K.phone), value: "" },
            { id: "note", label: t(K.note), value: false },
          ]}
        />
      </Sample>
    </div>
  );
}
