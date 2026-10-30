/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the native StatusIndicator: the five states, each with its own shape, in three sizes, so
 *          they read apart in greyscale too.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); gap inventory row 30.
 */
import type { Tone } from "@stackra/contracts";
import type { Size } from "@stackra/ui/contracts";
import { StatusIndicator, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { STATUS_INDICATOR_DEMO_KEYS } from "#src/demos/free/status-indicator/status-indicator-demo-keys.constant";

/** The demo's keys. */
const K = STATUS_INDICATOR_DEMO_KEYS.demo_free.status_indicator;

/** A realistic state for each tone. */
const STATE = {
  default: K.draft,
  accent: K.scheduled,
  success: K.ready,
  warning: K.waiting,
  danger: K.late,
} as const satisfies Record<Tone, unknown>;

const TONES = Object.keys(STATE) as Tone[];
const SIZES: readonly Size[] = ["sm", "md", "lg"];

/** Every tone at every size. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {SIZES.map((size) => (
        <View key={size} className="flex-row flex-wrap items-center gap-4">
          {TONES.map((tone) => (
            <StatusIndicator key={tone} tone={tone} size={size}>
              {t(STATE[tone])}
            </StatusIndicator>
          ))}
        </View>
      ))}
    </View>
  );
}
