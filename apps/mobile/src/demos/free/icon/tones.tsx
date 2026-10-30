/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native Icon: one icon per `tone`, labelled; with no tone it takes its holder's colour.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { TextTone } from "@stackra/ui/contracts";
import { Icon, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";

import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_DEMO_KEYS } from "#src/demos/free/icon/icon-demo-keys.constant";

/** The demo's keys. */
const K = ICON_DEMO_KEYS.demo_free.icon.tones;

/** Each tone, then no tone. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-5">
      {TextTone.map((tone) => (
        <Sample key={tone} caption={tone}>
          <Icon name="circle-check" size="lg" tone={tone} label={tone} />
        </Sample>
      ))}
      <Sample caption={t(K.inherits)}>
        <Icon name="circle-check" size="lg" />
      </Sample>
    </View>
  );
}
