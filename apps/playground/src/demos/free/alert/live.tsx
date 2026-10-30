/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Alert: Show a message the way an app does after an action. The failure is
 *          announced at once, the confirmation politely.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0312 (decisions 1 and 3); WCAG 2.2 SC 1.4.1 and 4.1.3; ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import { Alert as UiAlert, Button, useCatalogueText } from "@stackra/ui/react";
import { useId, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_KEYS } from "#src/demos/free/alert/alert-keys.constant";

/** The demo's keys. */
const K = ALERT_KEYS.alert;

/** The list that stacks alerts at a readable width. */
const STACK = "grid max-w-2xl gap-4";

/** Gives focus back to the button that showed a message once the message is gone, so a keyboard user keeps their place. */
function focusTrigger(id: string): void {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

/** Alert: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** A title and a description that fit each tone. */
  const TONE_COPY = {
    default: {
      title: t(K.sample.your_trial_is_active),
      description: t(K.sample.you_have_14_days_left),
    },
    accent: {
      title: t(K.sample.a_new_version_is_available),
      description: t(K.sample.reload_the_page_to_get),
    },
    success: { title: t(K.sample.changes_saved), description: t(K.sample.your_profile_is_up_to) },
    warning: {
      title: t(K.sample.storage_is_almost_full),
      description: t(K.sample.delete_files_or_upgrade_to),
    },
    danger: {
      title: t(K.sample.payment_failed),
      description: t(K.sample.your_card_was_declined_check),
    },
  } as const satisfies Record<Tone, { readonly title: string; readonly description: string }>;
  // useId: the page mounts this demo twice (Usage and the Right-to-left preview), so the ids must differ.
  const errorId = `${useId()}-show-error`;
  const savedId = `${errorId}-saved`;
  const [isErrorShown, setIsErrorShown] = useState(false);

  const [isSavedShown, setIsSavedShown] = useState(false);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button id={errorId} variant="secondary" onPress={() => setIsErrorShown(true)}>
          {t(K.show_error)}
        </Button>
        <Button id={savedId} variant="secondary" onPress={() => setIsSavedShown(true)}>
          {t(K.show_saved)}
        </Button>
      </div>
      <div className={STACK}>
        {isErrorShown ? (
          <UiAlert
            tone="danger"
            title={TONE_COPY.danger.title}
            description={TONE_COPY.danger.description}
            actions={
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => {
                    setIsErrorShown(false);
                    setIsSavedShown(true);
                    focusTrigger(savedId);
                  }}
                >
                  {t(K.retry)}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setIsErrorShown(false);
                    focusTrigger(errorId);
                  }}
                >
                  {t(K.dismiss)}
                </Button>
              </>
            }
          />
        ) : null}
        {isSavedShown ? (
          <UiAlert
            tone="success"
            title={TONE_COPY.success.title}
            description={TONE_COPY.success.description}
            actions={
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  setIsSavedShown(false);
                  focusTrigger(savedId);
                }}
              >
                {t(K.dismiss)}
              </Button>
            }
          />
        ) : null}
      </div>
    </div>
  );
}
