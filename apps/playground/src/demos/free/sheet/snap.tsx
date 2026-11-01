/**
 * Stackra file contract:
 * Purpose: the "snap" demo of the web Sheet: a bottom sheet that opens at a 200 px peek; swipe up to the full height, or down to close.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060
 *          (light, dark, RTL); owner approval 2026-10-31 (STA-1371).
 */
import { Button, Sheet, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHEET_KEYS } from "#src/demos/free/sheet/sheet-keys.constant";

/** The demo's keys. */
const K = SHEET_KEYS.sheet;

/** One partial stop; the full height is always the last one. */
const SNAP_POINTS = [200] as const;

/** The Sheet demo: snap points. */
export default function Snap() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sheet snapPoints={SNAP_POINTS} trigger={<Button variant="secondary">{t(K.snap_open)}</Button>}>
      <Sheet.Header>
        <Sheet.Title>{t(K.snap_title)}</Sheet.Title>
      </Sheet.Header>
      <Sheet.Body>
        <Text>{t(K.snap_body)}</Text>
      </Sheet.Body>
    </Sheet>
  );
}
