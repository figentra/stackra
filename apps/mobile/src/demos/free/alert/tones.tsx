/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native Alert: one alert per `tone`, each with its own icon and colour.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Enum, Tone } from "@stackra/contracts";
import { Alert, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_DEMO_KEYS } from "#src/demos/free/alert/alert-demo-keys.constant";

/** The demo's keys. */
const K = ALERT_DEMO_KEYS.demo_free.alert.tones;

/** One alert per tone. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {Enum.values(Tone).map((tone) => (
        <Alert
          key={tone}
          tone={tone}
          title={t(K.alert_title, { tone })}
          description={t(K.alert_description)}
        />
      ))}
    </View>
  );
}
