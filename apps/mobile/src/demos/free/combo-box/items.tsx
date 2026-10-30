/**
 * Stackra file contract:
 * Purpose: the "items" demo of the native ComboBox: choices with a second line, and Lisbon shown but refused.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { ComboBox, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COMBO_BOX_DEMO_KEYS } from "#src/demos/free/combo-box/combo-box-demo-keys.constant";

/** The demo's keys. */
const K = COMBO_BOX_DEMO_KEYS.demo_free.combo_box.items;

/** The offices, each with what it does. */
export default function Items() {
  const t = useCatalogueText(MESSAGES.en);
  const offices: readonly SelectItem[] = [
    { id: "cai", label: t(K.cairo), description: t(K.cairo_note) },
    { id: "ber", label: t(K.berlin), description: t(K.berlin_note) },
    { id: "ldn", label: t(K.london), description: t(K.london_note) },
    { id: "nyc", label: t(K.new_york), description: t(K.new_york_note) },
    { id: "lis", label: t(K.lisbon), description: t(K.lisbon_note), isDisabled: true },
  ];
  return <ComboBox label={t(K.label)} placeholder={t(K.placeholder)} items={offices} />;
}
