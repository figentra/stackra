/**
 * Stackra file contract:
 * Purpose: the "score" demo of the native Meter: a branch's rating out of five, best when high.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Meter, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { METER_DEMO_KEYS } from "#src/demos/free/meter/meter-demo-keys.constant";

/** The demo's keys. */
const K = METER_DEMO_KEYS.demo_free.meter.score;

/** Meter: a branch's rating out of five, best when high. */
export default function Score() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <Meter
        label={t(K.label)}
        value={4.6}
        minValue={1}
        maxValue={5}
        low={3}
        high={4}
        optimum={5}
        formatOptions={{ maximumFractionDigits: 1 }}
        valueLabel={t(K.value)}
      />
    </View>
  );
}
