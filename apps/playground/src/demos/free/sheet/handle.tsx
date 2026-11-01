/**
 * Stackra file contract:
 * Purpose: the "handle" demo of the web Sheet: drag the handle with a mouse; on touch the whole panel moves until it is fully open.
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

/** A peek of 240 px, so there is somewhere to drag to. */
const SNAP_POINTS = [240] as const;

/** The Sheet demo: drag by the handle. */
export default function Handle() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sheet
      snapPoints={SNAP_POINTS}
      trigger={<Button variant="secondary">{t(K.handle_open)}</Button>}
    >
      <Sheet.Close label={t(K.close)} />
      <Sheet.Header>
        <Sheet.Title>{t(K.handle_title)}</Sheet.Title>
      </Sheet.Header>
      <Sheet.Body>
        <Text>{t(K.handle_body)}</Text>
      </Sheet.Body>
    </Sheet>
  );
}
