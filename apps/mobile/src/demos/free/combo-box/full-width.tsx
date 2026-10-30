/**
 * Stackra file contract:
 * Purpose: the "full-width" demo of the native ComboBox: `isFullWidth` fills the parent.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { ComboBox, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COMBO_BOX_DEMO_KEYS } from "#src/demos/free/combo-box/combo-box-demo-keys.constant";

/** The demo's keys. */
const K = COMBO_BOX_DEMO_KEYS.demo_free.combo_box.full_width;
const C = COMBO_BOX_DEMO_KEYS.demo_free.combo_box.countries;

/** The countries' ids, in the catalogue's order; Andorra is refused. */
const COUNTRIES = [
  "ar",
  "ad",
  "au",
  "at",
  "be",
  "br",
  "ca",
  "cl",
  "cz",
  "dk",
  "eg",
  "fi",
  "fr",
  "de",
  "gr",
  "in",
  "it",
  "jp",
  "ke",
  "mx",
  "nl",
  "no",
  "es",
  "se",
] as const;

/** The field as wide as its parent. */
export default function FullWidth() {
  const t = useCatalogueText(MESSAGES.en);
  const countries: readonly SelectItem[] = COUNTRIES.map((id) => ({
    id,
    label: t(C[id]),
    isDisabled: id === "ad",
  }));
  return <ComboBox label={t(K.label)} items={countries} isFullWidth />;
}
