/**
 * Stackra file contract:
 * Purpose: the "backdrop" demo of the web Sheet: the three backdrop looks: opaque (the default), blur and transparent.
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

/** The Sheet demo: backdrop. */
export default function Backdrop() {
  const t = useCatalogueText(MESSAGES.en);
  const LOOKS = [
    { backdrop: "opaque", label: t(K.backdrop_opaque) },
    { backdrop: "blur", label: t(K.backdrop_blur) },
    { backdrop: "transparent", label: t(K.backdrop_transparent) },
  ] as const;
  return (
    <div className="flex flex-wrap gap-3">
      {LOOKS.map(({ backdrop, label }) => (
        <Sheet
          key={backdrop}
          backdrop={backdrop}
          trigger={<Button variant="secondary">{label}</Button>}
        >
          <Sheet.Close label={t(K.close)} />
          <Sheet.Header>
            <Sheet.Title>{t(K.backdrop_title, { look: label })}</Sheet.Title>
          </Sheet.Header>
          <Sheet.Body>
            <Text>{t(K.backdrop_body)}</Text>
          </Sheet.Body>
          <Sheet.Footer>
            <Button slot="close">{t(K.done)}</Button>
          </Sheet.Footer>
        </Sheet>
      ))}
    </div>
  );
}
