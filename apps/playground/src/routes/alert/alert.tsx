/**
 * Stackra file contract:
 * Purpose: the page of the alert route: every tone with a realistic message, the parts one at a time (title only,
 *          description, actions, an icon of its own, no icon), and a live sample that shows a failure and a
 *          confirmation as they happen, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. An alert already on the page
 *           when it loads is not announced, so the static samples say nothing; the live sample inserts one, which a
 *           screen reader reads at once for the failure (an alert) and politely for the confirmation (a status).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0312 (decisions 1 and 3); WCAG 2.2 SC 1.4.1 and 4.1.3; ADR
 *          0060 (light, dark, RTL).
 */
import { Enum, Tone } from "@stackra/contracts";
import { Alert as UiAlert, Button, Heading, Text } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { AlertRoute } from "#src/routes/alert/alert.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::alert.*` keys.
const STRINGS = {
  documentTitle: `${AlertRoute.title} · Stackra Playground`,
  intro:
    "An Alert is an inline message that stays on the page. The tone sets the colour and the icon, and how it is announced: a warning or a failure interrupts a screen reader, the rest wait their turn. The title and the icon carry the meaning, never the colour alone.",
  tones: "Tones",
  tonesNote: "One alert per tone, each with a title and a description that fit it.",
  parts: "Parts",
  partsNote:
    "The title is required. The description, the actions and the icon are optional, and the icon can be your own or none.",
  live: "Try it",
  liveNote:
    "Show a message the way an app does after an action. The failure is announced at once, the confirmation politely.",
  showError: "Show payment error",
  showSaved: "Show save confirmation",
  retry: "Try again",
  dismiss: "Dismiss",
  upgrade: "Upgrade plan",
  manage: "Manage files",
} as const;

/** A title and a description that fit each tone. */
const TONE_COPY = {
  default: {
    title: "Your trial is active",
    description: "You have 14 days left to try every feature.",
  },
  accent: {
    title: "A new version is available",
    description: "Reload the page to get the latest changes.",
  },
  success: { title: "Changes saved", description: "Your profile is up to date." },
  warning: {
    title: "Storage is almost full",
    description: "Delete files or upgrade to keep uploading.",
  },
  danger: {
    title: "Payment failed",
    description: "Your card was declined. Check the details and try again.",
  },
} as const satisfies Record<Tone, { readonly title: string; readonly description: string }>;

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

/** Gives focus back to the button that showed a message once the message is gone, so a keyboard user keeps their place. */
function focusTrigger(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

/** The Alert page. */
export function Alert() {
  const [isErrorShown, setIsErrorShown] = useState(false);
  const [isSavedShown, setIsSavedShown] = useState(false);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{AlertRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="alert-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
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
      </PageSection>

      <PageSection id="alert-parts" title={STRINGS.parts} note={STRINGS.partsNote}>
        <ul className={STACK}>
          <Sample caption="Title only">
            <UiAlert tone="success" title={TONE_COPY.success.title} />
          </Sample>
          <Sample caption="With actions">
            <UiAlert
              tone="warning"
              title={TONE_COPY.warning.title}
              description={TONE_COPY.warning.description}
              actions={
                <>
                  <Button size="sm" variant="secondary">
                    {STRINGS.upgrade}
                  </Button>
                  <Button size="sm" variant="ghost">
                    {STRINGS.manage}
                  </Button>
                </>
              }
            />
          </Sample>
          <Sample caption="An icon of your own">
            <UiAlert
              tone="accent"
              icon="circle-check"
              title={TONE_COPY.accent.title}
              description={TONE_COPY.accent.description}
            />
          </Sample>
          <Sample caption="No icon">
            <UiAlert
              tone="danger"
              icon={false}
              title={TONE_COPY.danger.title}
              description={TONE_COPY.danger.description}
            />
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="alert-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="flex flex-wrap items-center gap-4">
          <Button id="alert-show-error" variant="secondary" onPress={() => setIsErrorShown(true)}>
            {STRINGS.showError}
          </Button>
          <Button id="alert-show-saved" variant="secondary" onPress={() => setIsSavedShown(true)}>
            {STRINGS.showSaved}
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
                      focusTrigger("alert-show-saved");
                    }}
                  >
                    {STRINGS.retry}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      setIsErrorShown(false);
                      focusTrigger("alert-show-error");
                    }}
                  >
                    {STRINGS.dismiss}
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
                    focusTrigger("alert-show-saved");
                  }}
                >
                  {STRINGS.dismiss}
                </Button>
              }
            />
          ) : null}
        </div>
      </PageSection>
    </article>
  );
}
