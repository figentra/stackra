/**
 * Stackra file contract:
 * Purpose: the "scrollable" demo of the web Sheet: a long list at a peek: a swipe first expands the sheet, then the list scrolls.
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

/** A peek of 320 px, then the full height. */
const SNAP_POINTS = [320] as const;

/** Thirty order numbers for the list. */
const ORDERS = Array.from({ length: 30 }, (_, index) => 1042 + index);

/** The Sheet demo: scrollable content. */
export default function Scrollable() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sheet
      snapPoints={SNAP_POINTS}
      trigger={<Button variant="secondary">{t(K.scroll_open)}</Button>}
    >
      <Sheet.Close label={t(K.close)} />
      <Sheet.Header>
        <Sheet.Title>{t(K.scroll_title)}</Sheet.Title>
      </Sheet.Header>
      <Sheet.Body>
        <Text>{t(K.scroll_body)}</Text>
        <ul className="mt-3 grid gap-2">
          {ORDERS.map((number) => (
            <li
              key={number}
              className="rounded-[var(--radius-control)] bg-surface-secondary px-3 py-2"
            >
              <Text>{t(K.activity_item, { number })}</Text>
            </li>
          ))}
        </ul>
      </Sheet.Body>
    </Sheet>
  );
}
