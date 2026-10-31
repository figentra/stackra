/**
 * Stackra file contract:
 * Purpose: the "detached" demo of the web Sheet: a sheet that floats clear of the screen edges with every corner rounded.
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

/** The Sheet demo: detached. */
export default function Detached() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sheet isDetached trigger={<Button variant="secondary">{t(K.detached_open)}</Button>}>
      <Sheet.Close label={t(K.close)} />
      <Sheet.Header>
        <Sheet.Title>{t(K.detached_title)}</Sheet.Title>
      </Sheet.Header>
      <Sheet.Body>
        <Text>{t(K.detached_body)}</Text>
      </Sheet.Body>
      <Sheet.Footer>
        <Button slot="close">{t(K.done)}</Button>
      </Sheet.Footer>
    </Sheet>
  );
}
