/**
 * Stackra file contract:
 * Purpose: the "snap" demo of the native Sheet: a sheet that opens at a 240-point peek; drag it up to the full height
 *          or down past the peek to close it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-1371.
 */
import { Button, Sheet, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHEET_DEMO_KEYS } from "#src/demos/free/sheet/sheet-demo-keys.constant";

/** The demo's keys. */
const K = SHEET_DEMO_KEYS.demo_free.sheet.snap;

/** A peek, then the full height. */
const SNAP_POINTS = [240, "90%"] as const;

/** A sheet that rests at a peek. */
export default function Snap() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start">
      <Sheet
        snapPoints={SNAP_POINTS}
        trigger={
          <Button variant="secondary" size="sm">
            {t(K.open)}
          </Button>
        }
      >
        <Sheet.Header>
          <Sheet.Title>{t(K.heading)}</Sheet.Title>
          <Sheet.Close label={t(K.close)} />
        </Sheet.Header>
        <Sheet.Body>{t(K.body)}</Sheet.Body>
      </Sheet>
    </View>
  );
}
