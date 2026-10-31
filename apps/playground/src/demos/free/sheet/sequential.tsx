/**
 * Stackra file contract:
 * Purpose: the "sequential" demo of the web Sheet: two partial snap points before the full height; one swipe can pass several of them.
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

/** Two partial stops, then the full height. */
const SNAP_POINTS = [148, 355] as const;

/** The Sheet demo: sequential snap points. */
export default function Sequential() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sheet
      snapPoints={SNAP_POINTS}
      trigger={<Button variant="secondary">{t(K.sequential_open)}</Button>}
    >
      <Sheet.Header>
        <Sheet.Title>{t(K.sequential_title)}</Sheet.Title>
      </Sheet.Header>
      <Sheet.Body>
        <Text>{t(K.sequential_body)}</Text>
      </Sheet.Body>
    </Sheet>
  );
}
