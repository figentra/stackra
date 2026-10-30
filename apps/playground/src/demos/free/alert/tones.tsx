/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the web Alert: One alert per tone, each with a title and a description that fit it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0312 (decisions 1 and 3); WCAG 2.2 SC 1.4.1 and 4.1.3; ADR 0060 (light, dark, RTL).
 */
import { Enum, Tone } from "@stackra/contracts";
import { Alert as UiAlert, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_KEYS } from "#src/demos/free/alert/alert-keys.constant";

/** The demo's keys. */
const K = ALERT_KEYS.alert;
import type { ReactNode } from "react";

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

/** Alert: Tones. */
export default function Tones() {
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
      {Enum.values(Tone).map((tone) => (
        <Sample key={tone} caption={`tone="${tone}"`}>
          <UiAlert
            tone={tone}
            title={TONE_COPY[tone].title}
            description={TONE_COPY[tone].description}
          />
        </Sample>
      ))}
    </ul>
  );
}
