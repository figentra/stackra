/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native PropertyList: label and value pairs; a phone draws a single column.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { PropertyListItem } from "@stackra/ui/contracts";
import { PropertyList, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROPERTY_LIST_DEMO_KEYS } from "#src/demos/free/property-list/property-list-demo-keys.constant";

/** The demo's keys. */
const K = PROPERTY_LIST_DEMO_KEYS.demo_free.property_list.basics;

/** An order's details. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const items: readonly PropertyListItem[] = [
    { id: "number", label: t(K.order), value: "#1042" },
    { id: "customer", label: t(K.customer), value: "Ada Lovelace" },
    { id: "total", label: t(K.total), value: "$124.50" },
    { id: "placed", label: t(K.placed), value: t(K.placed_value) },
  ];
  return <PropertyList items={items} />;
}
