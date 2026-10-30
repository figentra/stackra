/**
 * Stackra file contract:
 * Purpose: the "icons" demo of the native Chip: `startIcon`, an `endIcon` mirrored in RTL, and both.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Chip, Icon, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHIP_DEMO_KEYS } from "#src/demos/free/chip/chip-demo-keys.constant";

/** The demo's keys. */
const K = CHIP_DEMO_KEYS.demo_free.chip.icons;

/** Icons are the size of the text. */
export default function Icons() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-2">
      <Chip tone="success" startIcon="check">
        {t(K.start)}
      </Chip>
      <Chip tone="accent" endIcon={<Icon name="chevron-right" />}>
        {t(K.end)}
      </Chip>
      <Chip tone="success" variant="soft" startIcon="check" endIcon={<Icon name="chevron-right" />}>
        {t(K.both)}
      </Chip>
    </View>
  );
}
