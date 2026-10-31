/**
 * Stackra file contract:
 * Purpose: the "backdrop" demo of the native Sheet: the three backdrop looks, opaque, blur (HeroUI Native's blur
 *          overlay) and transparent.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-1371.
 */
import { Button, Sheet, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHEET_DEMO_KEYS } from "#src/demos/free/sheet/sheet-demo-keys.constant";

/** The demo's keys. */
const K = SHEET_DEMO_KEYS.demo_free.sheet.backdrop;

/** One sheet per backdrop look. */
export default function Backdrop() {
  const t = useCatalogueText(MESSAGES.en);
  const LOOKS = [
    { backdrop: "opaque", label: t(K.opaque) },
    { backdrop: "blur", label: t(K.blur) },
    { backdrop: "transparent", label: t(K.transparent) },
  ] as const;
  return (
    <View className="flex-row flex-wrap gap-3">
      {LOOKS.map(({ backdrop, label }) => (
        <Sheet
          key={backdrop}
          backdrop={backdrop}
          trigger={
            <Button variant="secondary" size="sm">
              {label}
            </Button>
          }
        >
          <Sheet.Header>
            <Sheet.Title>{`${t(K.heading)}: ${label}`}</Sheet.Title>
            <Sheet.Close label={t(K.close)} />
          </Sheet.Header>
          <Sheet.Body>{t(K.body)}</Sheet.Body>
        </Sheet>
      ))}
    </View>
  );
}
