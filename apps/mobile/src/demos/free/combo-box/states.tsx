/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native ComboBox: required, invalid, disabled, read-only and a no-match message.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { ComboBox, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COMBO_BOX_DEMO_KEYS } from "#src/demos/free/combo-box/combo-box-demo-keys.constant";

/** The demo's keys. */
const K = COMBO_BOX_DEMO_KEYS.demo_free.combo_box.states;
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

/** Each state of the field; disabled and read-only keep their value. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const countries: readonly SelectItem[] = COUNTRIES.map((id) => ({
    id,
    label: t(C[id]),
    isDisabled: id === "ad",
  }));
  return (
    <View className="gap-4">
      <ComboBox label={t(K.required)} items={countries} isRequired />
      <ComboBox
        label={t(K.invalid)}
        items={countries}
        isInvalid
        errorMessage={t(K.invalid_error)}
      />
      <ComboBox label={t(K.disabled)} items={countries} isDisabled defaultValue="fr" />
      <ComboBox label={t(K.read_only)} items={countries} isReadOnly defaultValue="fr" />
      <ComboBox label={t(K.no_match)} items={countries} emptyMessage={t(K.no_match_message)} />
    </View>
  );
}
