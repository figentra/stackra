/**
 * Stackra file contract:
 * Purpose: the "modes" demo of the native ComboBox: one choice fills the field; `selectionMode="multiple"` toggles several.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { ComboBox, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COMBO_BOX_DEMO_KEYS } from "#src/demos/free/combo-box/combo-box-demo-keys.constant";

/** The demo's keys. */
const K = COMBO_BOX_DEMO_KEYS.demo_free.combo_box.modes;
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

/** One country, then several; the sheet stays open while choices toggle. */
export default function Modes() {
  const [several, setSeveral] = useState<readonly string[]>(["eg", "fr"]);
  const t = useCatalogueText(MESSAGES.en);
  const countries: readonly SelectItem[] = COUNTRIES.map((id) => ({
    id,
    label: t(C[id]),
    isDisabled: id === "ad",
  }));
  return (
    <View className="gap-4">
      <ComboBox label={t(K.single)} items={countries} defaultValue="eg" />
      <ComboBox
        label={t(K.multiple)}
        items={countries}
        selectionMode="multiple"
        value={several}
        onChange={setSeveral}
      />
    </View>
  );
}
