/**
 * Stackra file contract:
 * Purpose: the "answer" demo of the web useConfirmation: the awaited answer is true only when the user confirms, and
 *          false for Cancel, Escape and a replaced question; the status line reads it out.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0312; WCAG 2.2 SC 4.1.2.
 */
import {
  Button,
  ConfirmationProvider,
  Text,
  useCatalogueText,
  useConfirmation,
} from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { USE_CONFIRMATION_KEYS } from "#src/demos/free/use-confirmation/use-confirmation-keys.constant";

/** The demo's keys. */
const K = USE_CONFIRMATION_KEYS.use_confirmation;

/** One question and the answer it got. */
function Question() {
  const t = useCatalogueText(MESSAGES.en);
  const confirm = useConfirmation();
  const [answer, setAnswer] = useState(t(K.no_answer));
  const name = t(K.plain);

  const ask = async () => {
    const isConfirmed = await confirm({
      title: t(K.plain_dialog.title),
      description: t(K.plain_dialog.description),
      confirmLabel: t(K.plain_dialog.confirm),
      cancelLabel: t(K.plain_dialog.cancel),
    });
    setAnswer(t(isConfirmed ? K.yes : K.no, { name }));
  };

  return (
    <div className="grid justify-items-start gap-4">
      <Button variant="secondary" onPress={() => void ask()}>
        {name}
      </Button>
      <Text role="status">
        <bdi>{answer}</bdi>
      </Text>
    </div>
  );
}

/** useConfirmation: Last answer. */
export default function Answer() {
  return (
    <ConfirmationProvider>
      <Question />
    </ConfirmationProvider>
  );
}
