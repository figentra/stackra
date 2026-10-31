/**
 * Stackra file contract:
 * Purpose: the "nested" demo of the web Sheet: a sheet opened inside another stacks over it, three levels deep; the one under scales back.
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

/** The Sheet demo: nested sheets. */
export default function Nested() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sheet trigger={<Button variant="secondary">{t(K.nested_open)}</Button>}>
      <Sheet.Close label={t(K.close)} />
      <Sheet.Header>
        <Sheet.Title>{t(K.nested_title)}</Sheet.Title>
      </Sheet.Header>
      <Sheet.Body>
        <div className="grid gap-3 pb-2">
          <Text>{t(K.nested_body)}</Text>
          <Sheet trigger={<Button variant="secondary">{t(K.nested_child_open)}</Button>}>
            <Sheet.Header>
              <Sheet.Title>{t(K.nested_child_title)}</Sheet.Title>
            </Sheet.Header>
            <Sheet.Body>
              <div className="grid gap-3 pb-2">
                <Text>{t(K.nested_child_body)}</Text>
                <Sheet trigger={<Button variant="secondary">{t(K.nested_deeper_open)}</Button>}>
                  <Sheet.Header>
                    <Sheet.Title>{t(K.nested_deeper_title)}</Sheet.Title>
                  </Sheet.Header>
                  <Sheet.Body>
                    <Text>{t(K.nested_deeper_body)}</Text>
                  </Sheet.Body>
                  <Sheet.Footer>
                    <Button slot="close">{t(K.back)}</Button>
                  </Sheet.Footer>
                </Sheet>
              </div>
            </Sheet.Body>
            <Sheet.Footer>
              <Button variant="secondary" slot="close">
                {t(K.back)}
              </Button>
            </Sheet.Footer>
          </Sheet>
        </div>
      </Sheet.Body>
    </Sheet>
  );
}
