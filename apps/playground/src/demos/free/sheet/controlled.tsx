/**
 * Stackra file contract:
 * Purpose: the "controlled" demo of the web Sheet: the app holds the open state: a button outside opens it and a line shows the state.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060
 *          (light, dark, RTL); owner approval 2026-10-31 (STA-1371).
 */
import { useState } from "react";
import { Button, Sheet, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHEET_KEYS } from "#src/demos/free/sheet/sheet-keys.constant";

/** The demo's keys. */
const K = SHEET_KEYS.sheet;

/** The Sheet demo: controlled. */
export default function Controlled() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  return (
    <div className="grid justify-items-start gap-3">
      <Button variant="secondary" onPress={() => setOpen(true)}>
        {t(K.controlled_open)}
      </Button>
      <Text role="status">{t(isOpen ? K.state_open : K.state_closed)}</Text>
      <Sheet isOpen={isOpen} onOpenChange={setOpen}>
        <Sheet.Header>
          <Sheet.Title>{t(K.controlled_title)}</Sheet.Title>
        </Sheet.Header>
        <Sheet.Body>
          <Text>{t(K.controlled_body)}</Text>
        </Sheet.Body>
        <Sheet.Footer>
          <Button onPress={() => setOpen(false)}>{t(K.done)}</Button>
        </Sheet.Footer>
      </Sheet>
    </div>
  );
}
