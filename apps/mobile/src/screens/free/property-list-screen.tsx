/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `PropertyList` (@stackra/ui): label and value rows, the text
 *          shown for an empty value (a dash, or words), values that are elements, and a copy button on a row, with a
 *          readout of what was copied.
 * Boundary: presentation and local demo state only; the list is @stackra/ui's, nothing here is styled by hand. The app
 *          has no clipboard module, so the copy sample reports the text it was given instead of writing it.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { PropertyListItem } from "@stackra/ui/contracts";
import { Chip, PropertyList, StatusBadge, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "One column of label and value pairs; a phone always draws a single column.",
  },
  empty: {
    title: "Empty values",
    description:
      "A missing, empty or `false` value shows `emptyValue`, a dash by default; `0` is a value.",
    custom: "With words instead of a dash",
    notSet: "Not set",
  },
  elements: {
    title: "Values that are elements",
    description: "A value can be any element: a status, a chip, a link.",
  },
  copy: {
    title: "Copy",
    description:
      "A row with a `copyLabel` has a copy button once the list has `onCopy`; the app writes the clipboard there.",
    copied: (text: string | null) => `Copied: ${text ?? "nothing yet"}`,
    copyId: "Copy the order id",
    copyEmail: "Copy the customer's email",
  },
} as const;

/** The rows of the basic list. */
const ORDER: readonly PropertyListItem[] = [
  { id: "number", label: "Order", value: "#1042" },
  { id: "customer", label: "Customer", value: "Ada Lovelace" },
  { id: "total", label: "Total", value: "$124.50" },
  { id: "placed", label: "Placed on", value: "24 October 2026" },
];

/** The rows with empty values, and a zero. */
const GAPS: readonly PropertyListItem[] = [
  { id: "company", label: "Company" },
  { id: "note", label: "Note", value: "" },
  { id: "gift", label: "Gift", value: false },
  { id: "discount", label: "Discount", value: 0 },
];

/** The rows whose values are elements. */
const ELEMENTS: readonly PropertyListItem[] = [
  { id: "status", label: "Status", value: <StatusBadge tone="success">Paid</StatusBadge> },
  { id: "tags", label: "Tags", value: <Chip size="sm">Priority</Chip> },
];

/** The rows with a copy button. */
const COPYABLE: readonly PropertyListItem[] = [
  {
    id: "id",
    label: "Order id",
    value: "ord_01H2J3K4L5M6N7P8Q9R0",
    copyLabel: STRINGS.copy.copyId,
  },
  {
    id: "email",
    label: "Email",
    value: "ada@example.com",
    copyLabel: STRINGS.copy.copyEmail,
  },
];

/** The PropertyList page: one section per option, in a scrollable screen. */
export function PropertyListScreen() {
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <PropertyList items={ORDER} />
      </Section>

      <Section title={STRINGS.empty.title} description={STRINGS.empty.description}>
        <PropertyList items={GAPS} />
        <Text type="small" tone="muted">
          {STRINGS.empty.custom}
        </Text>
        <PropertyList items={GAPS.slice(0, 2)} emptyValue={STRINGS.empty.notSet} />
      </Section>

      <Section title={STRINGS.elements.title} description={STRINGS.elements.description}>
        <PropertyList items={ELEMENTS} />
      </Section>

      <Section title={STRINGS.copy.title} description={STRINGS.copy.description}>
        <PropertyList items={COPYABLE} onCopy={(_item, text) => setCopied(text)} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.copy.copied(copied)}
        </Text>
      </Section>
    </Screen>
  );
}
