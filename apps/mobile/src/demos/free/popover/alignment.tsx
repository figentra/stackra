/**
 * Stackra file contract:
 * Purpose: the "alignment" demo of the native Popover: `align` lines it up with the start, the centre or the end of its trigger.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { PlacementAlign } from "@stackra/ui/contracts";
import { Button, Popover, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { POPOVER_DEMO_KEYS } from "#src/demos/free/popover/popover-demo-keys.constant";

/** The demo's keys. */
const K = POPOVER_DEMO_KEYS.demo_free.popover.alignment;

/** One trigger per value. */
export default function Alignment() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-2">
      {PlacementAlign.map((align) => (
        <Popover
          key={align}
          align={align}
          trigger={
            <Button variant="secondary" size="sm">
              {t(K.open, { align })}
            </Button>
          }
        >
          {t(K.body, { align })}
        </Popover>
      ))}
    </View>
  );
}
