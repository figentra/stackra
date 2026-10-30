/**
 * Stackra file contract:
 * Purpose: the "elements" demo of the native PropertyList: a value can be any element, such as a status or a chip.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { PropertyListItem } from "@stackra/ui/contracts";
import { Chip, PropertyList, StatusBadge, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROPERTY_LIST_DEMO_KEYS } from "#src/demos/free/property-list/property-list-demo-keys.constant";

/** The demo's keys. */
const K = PROPERTY_LIST_DEMO_KEYS.demo_free.property_list.elements;

/** A status and a tag. */
export default function Elements() {
  const t = useCatalogueText(MESSAGES.en);
  const items: readonly PropertyListItem[] = [
    {
      id: "status",
      label: t(K.status),
      value: <StatusBadge tone="success">{t(K.paid)}</StatusBadge>,
    },
    { id: "tags", label: t(K.tags), value: <Chip size="sm">{t(K.priority)}</Chip> },
  ];
  return <PropertyList items={items} />;
}
