/**
 * Stackra file contract:
 * Purpose: the "parts" demo of the web Alert: The title is required. The description, the actions and the icon are
 *          optional, and the icon can be your own or none.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0312 (decisions 1 and 3); WCAG 2.2 SC 1.4.1 and 4.1.3; ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import { Alert as UiAlert, Button, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_KEYS } from "#src/demos/free/alert/alert-keys.constant";

/** The demo's keys. */
const K = ALERT_KEYS.alert;

/** The list that stacks alerts at a readable width. */
const STACK = "grid max-w-2xl gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      {children}
    </li>
  );
}

/** The Alert demo: parts. */
export default function Parts() {
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
  return (
    <ul className={STACK}>
      <Sample caption={t(K.sample.title_only)}>
        <UiAlert tone="success" title={TONE_COPY.success.title} />
      </Sample>
      <Sample caption={t(K.sample.with_actions)}>
        <UiAlert
          tone="warning"
          title={TONE_COPY.warning.title}
          description={TONE_COPY.warning.description}
          actions={
            <>
              <Button size="sm" variant="secondary">
                {t(K.upgrade)}
              </Button>
              <Button size="sm" variant="ghost">
                {t(K.manage)}
              </Button>
            </>
          }
        />
      </Sample>
      <Sample caption={t(K.sample.an_icon_of_your_own)}>
        <UiAlert
          tone="accent"
          icon="circle-check"
          title={TONE_COPY.accent.title}
          description={TONE_COPY.accent.description}
        />
      </Sample>
      <Sample caption={t(K.sample.no_icon)}>
        <UiAlert
          tone="danger"
          icon={false}
          title={TONE_COPY.danger.title}
          description={TONE_COPY.danger.description}
        />
      </Sample>
    </ul>
  );
}
