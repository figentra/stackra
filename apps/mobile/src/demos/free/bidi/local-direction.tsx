/**
 * Stackra file contract:
 * Purpose: the "local-direction" demo of the native Bidi: a bank transfer card whose IBAN field is a left-to-right
 *          block inside an Arabic screen, beside a note that follows the screen.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { Bidi, Card, TextField, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BIDI_DEMO_KEYS } from "#src/demos/free/bidi/bidi-demo-keys.constant";

/** The demo's keys. */
const K = BIDI_DEMO_KEYS.demo_free.bidi.local_direction;

/** A Saudi IBAN in its printed groups (data, never translated). */
const IBAN = "SA03 8000 0000 6080 1016 7519";

/** An IBAN that reads left to right in any screen. */
export default function LocalDirection() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card>
      <Card.Header>
        <Card.Title>{t(K.transfer)}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-3">
        <Bidi isBlock dir="ltr">
          <TextField label={t(K.iban)} defaultValue={IBAN} />
        </Bidi>
        <TextField label={t(K.note)} defaultValue={t(K.note_value)} />
      </Card.Content>
    </Card>
  );
}
