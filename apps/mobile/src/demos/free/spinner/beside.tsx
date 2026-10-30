/**
 * Stackra file contract:
 * Purpose: the "beside" demo of the native Spinner: decorative, without `label`; the text beside it carries the meaning.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Spinner, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SPINNER_DEMO_KEYS } from "#src/demos/free/spinner/spinner-demo-keys.constant";

/** The demo's keys. */
const K = SPINNER_DEMO_KEYS.demo_free.spinner.beside;

/** A small muted spinner and its words. */
export default function Beside() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row items-center gap-2">
      <Spinner size="sm" tone="muted" />
      <Text tone="muted">{t(K.results)}</Text>
    </View>
  );
}
