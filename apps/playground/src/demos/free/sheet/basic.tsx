/**
 * Stackra file contract:
 * Purpose: the "basic" demo of the web Sheet: a bottom sheet of filters with a title, a body, a close button and footer actions.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060
 *          (light, dark, RTL); owner approval 2026-10-31 (STA-1371).
 */
import { Button, Checkbox, Sheet, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHEET_KEYS } from "#src/demos/free/sheet/sheet-keys.constant";

/** The demo's keys. */
const K = SHEET_KEYS.sheet;

/** The Sheet demo: basic. */
export default function Basic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sheet trigger={<Button variant="secondary">{t(K.open)}</Button>}>
      <Sheet.Close label={t(K.close)} />
      <Sheet.Header>
        <Sheet.Title>{t(K.filters_title)}</Sheet.Title>
      </Sheet.Header>
      <Sheet.Body>
        <div className="grid gap-3">
          <Text>{t(K.filters_body)}</Text>
          <Checkbox label={t(K.in_stock)} defaultValue />
          <Checkbox label={t(K.on_sale)} />
        </div>
      </Sheet.Body>
      <Sheet.Footer>
        <Button variant="secondary" slot="close">
          {t(K.cancel)}
        </Button>
        <Button slot="close">{t(K.apply)}</Button>
      </Sheet.Footer>
    </Sheet>
  );
}
