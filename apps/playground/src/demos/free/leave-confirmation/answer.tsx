/**
 * Stackra file contract:
 * Purpose: the "answer" demo of the web Leave confirmation: the note starts unsaved, so Leave asks at once; the status line reads out whether you stayed or left.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.5.8, 3.3.4 and 4.1.2.
 */
import type { LeaveConfirmationHandle } from "@stackra/ui/contracts";
import { Button, LeaveConfirmation, Text, TextField, useCatalogueText } from "@stackra/ui/react";
import { useRef, useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { LEAVE_CONFIRMATION_KEYS } from "#src/demos/free/leave-confirmation/leave-confirmation-keys.constant";

/** The demo's keys. */
const K = LEAVE_CONFIRMATION_KEYS.leave_confirmation;

/** Leave confirmation: Answer. */
export default function Answer() {
  const t = useCatalogueText(MESSAGES.en);
  const leave = useRef<LeaveConfirmationHandle>(null);
  const [saved, setSaved] = useState("");
  const [note, setNote] = useState(() => t(K.draft_text));
  const [answer, setAnswer] = useState(t(K.no_answer));
  const isDirty = note !== saved;

  const tryToLeave = async () => {
    const mayLeave = (await leave.current?.confirmLeave()) ?? false;
    // Leaving drops what was not saved, as a real navigation would.
    if (mayLeave) setNote(saved);
    setAnswer(t(mayLeave ? K.left : K.stayed));
  };

  return (
    <div className="grid max-w-sm gap-4">
      <Text role="status">
        <bdi>{answer}</bdi>
      </Text>
      <TextField
        label={t(K.note_label)}
        placeholder={t(K.note_placeholder)}
        value={note}
        onChange={setNote}
      />
      <ul className="flex flex-wrap items-center gap-4">
        <li>
          <Button onPress={() => setSaved(note)} isDisabled={!isDirty}>
            {t(K.save)}
          </Button>
        </li>
        <li>
          <Button variant="secondary" onPress={() => void tryToLeave()}>
            {t(K.leave)}
          </Button>
        </li>
      </ul>
      <Text tone="muted">
        <bdi>{t(isDirty ? K.dirty : K.clean)}</bdi>
      </Text>
      <LeaveConfirmation
        ref={leave}
        when={isDirty}
        title={t(K.title)}
        description={t(K.description)}
        stayLabel={t(K.stay)}
        discardLabel={t(K.discard)}
      />
    </div>
  );
}
