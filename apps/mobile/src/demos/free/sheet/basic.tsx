/**
 * Stackra file contract:
 * Purpose: the "basic" demo of the native Sheet: a bottom sheet of filters with a title, a body and an action that
 *          closes it; a drag down closes it too.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-1371.
 */
import { Button, Sheet, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHEET_DEMO_KEYS } from "#src/demos/free/sheet/sheet-demo-keys.constant";

/** The demo's keys. */
const K = SHEET_DEMO_KEYS.demo_free.sheet.basic;

/** A bottom sheet of filters. */
export default function Basic() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View className="items-start">
      <Sheet
        isOpen={isOpen}
        onOpenChange={setIsOpen}
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
        <Sheet.Footer>
          <Button onPress={() => setIsOpen(false)}>{t(K.apply)}</Button>
        </Sheet.Footer>
      </Sheet>
    </View>
  );
}
