/**
 * Stackra file contract:
 * Purpose: the "placement" demo of the web Sheet: a sheet from each edge; start and end follow the reading direction, so they swap sides in Arabic.
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

/** The Sheet demo: placement. */
export default function Placement() {
  const t = useCatalogueText(MESSAGES.en);
  const PLACEMENTS = [
    { placement: "bottom", label: t(K.open_bottom), edge: t(K.edge_bottom) },
    { placement: "top", label: t(K.open_top), edge: t(K.edge_top) },
    { placement: "start", label: t(K.open_start), edge: t(K.edge_start) },
    { placement: "end", label: t(K.open_end), edge: t(K.edge_end) },
  ] as const;
  return (
    <div className="flex flex-wrap gap-3">
      {PLACEMENTS.map(({ placement, label, edge }) => (
        <Sheet
          key={placement}
          placement={placement}
          trigger={<Button variant="secondary">{label}</Button>}
        >
          <Sheet.Close label={t(K.close)} />
          <Sheet.Header>
            <Sheet.Title>{t(K.placement_title, { edge })}</Sheet.Title>
          </Sheet.Header>
          <Sheet.Body>
            <Text>{t(K.placement_body)}</Text>
          </Sheet.Body>
          <Sheet.Footer>
            <Button slot="close">{t(K.done)}</Button>
          </Sheet.Footer>
        </Sheet>
      ))}
    </div>
  );
}
