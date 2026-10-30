/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native Spinner: one spinner per `tone`; `accent` is the default.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { TextTone } from "@stackra/ui/contracts";
import { Spinner, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPINNER_DEMO_KEYS } from "#src/demos/free/spinner/spinner-demo-keys.constant";

/** The demo's keys. */
const K = SPINNER_DEMO_KEYS.demo_free.spinner.tones;

/** Each tone, labelled. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-6">
      {TextTone.map((tone) => (
        <Sample key={tone} caption={tone}>
          <Spinner tone={tone} label={t(K.label, { tone })} />
        </Sample>
      ))}
    </View>
  );
}
