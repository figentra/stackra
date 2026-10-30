/**
 * Stackra file contract:
 * Purpose: the "icons" demo of the web Alert dialog: a custom icon in place of the tone’s, and a dialog with no icon
 *          at all.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 3 and 7); ADR 0312; WAI-ARIA `alertdialog`; WCAG 2.2 SC 2.1.2, 2.5.8 and 4.1.2.
 */
import {
  AlertDialog,
  Button,
  Text,
  useCatalogueText,
  type AlertDialogProps,
} from "@stackra/ui/react";
import { useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_DIALOG_KEYS } from "#src/demos/free/alert-dialog/alert-dialog-keys.constant";

/** The demo's keys. */
const K = ALERT_DIALOG_KEYS.alert_dialog;

/** The dialogs this demo opens: each one's words are `samples.<id>.*` in the catalogue. */
const SAMPLES: readonly {
  readonly id: keyof typeof K.samples;
  readonly props?: Pick<
    AlertDialogProps,
    "tone" | "icon" | "isDismissable" | "isKeyboardDismissDisabled"
  >;
}[] = [
  { id: "custom_icon", props: { tone: "danger", icon: Icons.Trash } },
  { id: "no_icon", props: { icon: false } },
];

/** Alert dialog: Icons. */
export default function IconsDemo() {
  const t = useCatalogueText(MESSAGES.en);
  const [open, setOpen] = useState<string | null>(null);
  const [answer, setAnswer] = useState(t(K.no_answer));

  return (
    <div className="grid gap-4">
      <ul className="flex flex-wrap items-center gap-4">
        {SAMPLES.map(({ id }) => (
          <li key={id}>
            <Button variant="secondary" onPress={() => setOpen(id)}>
              {t(K.samples[id].trigger)}
            </Button>
          </li>
        ))}
      </ul>
      <Text role="status" tone="muted">
        <bdi>{answer}</bdi>
      </Text>
      {SAMPLES.map(({ id, props }) => {
        const words = K.samples[id];
        const name = t(words.trigger);
        return (
          <AlertDialog
            key={id}
            {...props}
            isOpen={open === id}
            onOpenChange={(isOpen) => {
              if (!isOpen) setOpen((current) => (current === id ? null : current));
            }}
            title={t(words.title)}
            description={t(words.description)}
            confirmLabel={t(words.confirm)}
            cancelLabel={t(words.cancel)}
            onConfirm={() => setAnswer(t(K.confirmed, { name }))}
            onCancel={() => setAnswer(t(K.cancelled, { name }))}
          />
        );
      })}
    </div>
  );
}
