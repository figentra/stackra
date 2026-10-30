/**
 * Stackra file contract:
 * Purpose: the "local-direction" demo of the web Bidi: a bank transfer form whose IBAN field is a left-to-right block
 *          inside an Arabic page, so its digits, caret and arrow keys run left to right, beside a note that follows
 *          the page.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Bidi, Card, TextField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BIDI_KEYS } from "#src/demos/free/bidi/bidi-keys.constant";

/** The demo's keys. */
const K = BIDI_KEYS.bidi;

/** A Saudi IBAN in its printed groups (data, never translated). */
const IBAN = "SA03 8000 0000 6080 1016 7519";

/** Bidi: Local direction. */
export default function LocalDirection() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="max-w-md">
      <Card.Header>
        <Card.Title>{t(K.transfer)}</Card.Title>
      </Card.Header>
      <Card.Content className="grid gap-3">
        <Bidi isBlock dir="ltr">
          <TextField label={t(K.iban)} defaultValue={IBAN} />
        </Bidi>
        <TextField label={t(K.note)} defaultValue={t(K.note_value)} />
      </Card.Content>
    </Card>
  );
}
