/**
 * Stackra file contract:
 * Purpose: the "kinds" demo of the native Sparkline: the same trend as a line, an area and bars.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Stackra's own charts).
 */
import { Sparkline, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SPARKLINE_DEMO_KEYS } from "#src/demos/free/sparkline/sparkline-demo-keys.constant";

/** The demo's keys. */
const K = SPARKLINE_DEMO_KEYS.demo_free.sparkline.kinds;

const DATA = [12, 18, 15, 22, 19, 27, 24, 31, 28, 35, 33, 41];

/** The same trend as a line, an area and bars. */
export default function Kinds() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {(["line", "area", "bar"] as const).map((kind) => (
        <View key={kind} className="flex-row items-center gap-4">
          <Text type="small" tone="muted" className="w-14">
            {t(K[kind])}
          </Text>
          <View className="flex-1">
            <Sparkline data={DATA} kind={kind} label={t(K.label)} />
          </View>
        </View>
      ))}
    </View>
  );
}
