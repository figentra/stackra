/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native StatusBadge: one row per `size`, one badge per `tone`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Enum, Tone } from "@stackra/contracts";
import { Size } from "@stackra/ui/contracts";
import { StatusBadge, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { STATUS_BADGE_DEMO_KEYS } from "#src/demos/free/status-badge/status-badge-demo-keys.constant";

/** The demo's keys. */
const K = STATUS_BADGE_DEMO_KEYS.demo_free.status_badge;

/** Each tone with a state that fits it. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {Size.map((size) => (
        <Sample key={size} caption={t(K.size, { size })}>
          <View className="flex-row flex-wrap gap-2">
            {Enum.values(Tone).map((tone) => (
              <StatusBadge key={tone} tone={tone} size={size}>
                {t(K.states[tone])}
              </StatusBadge>
            ))}
          </View>
        </Sample>
      ))}
    </View>
  );
}
