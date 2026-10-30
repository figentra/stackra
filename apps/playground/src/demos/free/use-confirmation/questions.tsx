/**
 * Stackra file contract:
 * Purpose: the "questions" demo of the web useConfirmation: each button asks in its handler and acts on the answer;
 *          the counter moves only when the deletion is confirmed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0312; WCAG 2.2 SC 2.5.8,
 *          3.3.4 and 4.1.2.
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

/** The buttons and the status lines; they sit inside the provider, because the hook reads it. */
function Questions() {
  const t = useCatalogueText(MESSAGES.en);
  const confirm = useConfirmation();
  const [answer, setAnswer] = useState(t(K.no_answer));
  const [deleted, setDeleted] = useState(0);

  const ask = async (name: string, options: Parameters<typeof confirm>[0]) => {
    const isConfirmed = await confirm(options);
    setAnswer(t(isConfirmed ? K.yes : K.no, { name }));
    return isConfirmed;
  };

  const deleteWorkspace = async () => {
    const isConfirmed = await ask(t(K.typed), {
      title: t(K.typed_dialog.title),
      description: t(K.typed_dialog.description),
      confirmLabel: t(K.typed_dialog.confirm),
      cancelLabel: t(K.typed_dialog.cancel),
      tone: "danger",
      confirmationText: "Acme",
      confirmationLabel: t(K.typed_dialog.confirmation),
    });
    if (isConfirmed) setDeleted((count) => count + 1);
  };

  return (
    <div className="grid gap-4">
      <ul className="flex flex-wrap items-center gap-4">
        <li>
          <Button
            variant="secondary"
            onPress={() =>
              void ask(t(K.plain), {
                title: t(K.plain_dialog.title),
                description: t(K.plain_dialog.description),
                confirmLabel: t(K.plain_dialog.confirm),
                cancelLabel: t(K.plain_dialog.cancel),
              })
            }
          >
            {t(K.plain)}
          </Button>
        </li>
        <li>
          <Button
            variant="danger-soft"
            onPress={() =>
              void ask(t(K.danger), {
                title: t(K.danger_dialog.title),
                description: t(K.danger_dialog.description),
                confirmLabel: t(K.danger_dialog.confirm),
                cancelLabel: t(K.danger_dialog.cancel),
                tone: "danger",
              })
            }
          >
            {t(K.danger)}
          </Button>
        </li>
        <li>
          <Button variant="danger-soft" onPress={() => void deleteWorkspace()}>
            {t(K.typed)}
          </Button>
        </li>
      </ul>
      <Text>
        <bdi>{t(K.deleted, { count: deleted })}</bdi>
      </Text>
      <Text role="status" tone="muted">
        <bdi>{answer}</bdi>
      </Text>
    </div>
  );
}

/** The useConfirmation demo: questions. */
export default function QuestionsDemo() {
  return (
    <ConfirmationProvider>
      <Questions />
    </ConfirmationProvider>
  );
}
