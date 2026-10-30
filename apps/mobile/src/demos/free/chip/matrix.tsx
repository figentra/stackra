/**
 * Stackra file contract:
 * Purpose: the "matrix" demo of the native Chip: a block per `size`, a row per `variant`, a chip per `tone`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Enum, Tone } from "@stackra/contracts";
import { ChipVariant, Size } from "@stackra/ui/contracts";
import { Chip, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHIP_DEMO_KEYS } from "#src/demos/free/chip/chip-demo-keys.constant";

/** The demo's keys. */
const K = CHIP_DEMO_KEYS.demo_free.chip.matrix;

/** Every tone of every variant of every size, each chip named by its tone. */
export default function Matrix() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {Size.map((size) =>
        ChipVariant.map((variant) => (
          <Sample key={`${size}-${variant}`} caption={t(K.size, { size, variant })}>
            <View className="flex-row flex-wrap gap-2">
              {Enum.values(Tone).map((tone) => (
                <Chip key={tone} size={size} variant={variant} tone={tone}>
                  {tone}
                </Chip>
              ))}
            </View>
          </Sample>
        )),
      )}
    </View>
  );
}
