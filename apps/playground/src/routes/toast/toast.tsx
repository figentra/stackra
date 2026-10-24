/**
 * Stackra file contract:
 * Purpose: the page of the toast route: a button for every tone, the options one at a time (a description, an action,
 *          a toast that stays, an icon of its own, no icon), the screen edge as a switch, and a button that stacks
 *          several toasts and one that dismisses them all, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The page mounts its own
 *           `ToastProvider`, because the playground shell has none yet; an app mounts one near its root instead, and
 *           the page clears the queue when it unmounts so a toast does not follow the reader to the next page. A
 *           toast is announced when it appears (a warning or a failure at once, the rest politely), so the buttons
 *           that show one say nothing themselves.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3 and 2.2.1; ADR
 *          0060 (light, dark, RTL).
 */
import { Tone } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useEffect, useState } from "react";

import { PageSection } from "#src/components/page-section";
import { ToastRoute } from "#src/routes/toast/toast.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::toast.*` keys.
const STRINGS = {
  documentTitle: `${ToastRoute.title} · Stackra Playground`,
  intro:
    "A toast is a short message that appears over the page and goes away by itself. Call toast() from anywhere once a ToastProvider is mounted. A warning or a failure interrupts a screen reader; the rest wait their turn. Press Alt and T to move focus to the toasts.",
  dismissLabel: "Dismiss notification",
  tones: "Tones",
  tonesNote: "One button per tone; each shows a toast that fits it.",
  show: (tone: string) => `Show ${tone} toast`,
  options: "Options",
  optionsNote:
    "A description, one action, a toast that stays until dismissed, and an icon of your own or none.",
  control: "Position and control",
  controlNote:
    "Toasts sit against the bottom edge or the top. Show several to see them stack, and dismiss them all at once.",
  withDescription: "With a description",
  withAction: "With an action",
  staying: "Stays until dismissed",
  ownIcon: "An icon of your own",
  noIcon: "No icon",
  atTop: "Show toasts at the top",
  stack: "Show three toasts",
  clear: "Dismiss all toasts",
} as const;

/** A message that fits each tone. */
const TONE_MESSAGES = {
  default: "Draft autosaved",
  accent: "A new version is available",
  success: "Changes saved",
  warning: "Storage is almost full",
  danger: "Payment failed",
} as const satisfies Record<Tone, string>;

/** The row that lays buttons out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The Toast page. */
export function Toast() {
  const [isTop, setIsTop] = useState(false);

  // The queue is global, so a toast shown here would still be waiting when the reader came back to this page.
  useEffect(() => () => Ui.toast.clear(), []);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <Ui.ToastProvider dismissLabel={STRINGS.dismissLabel} position={isTop ? "top" : "bottom"} />
      <header className="grid gap-2">
        <Ui.Heading level={1}>{ToastRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="toast-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
        <div className={ROW}>
          {Tone.map((tone) => (
            <Ui.Button
              key={tone}
              variant="secondary"
              onPress={() => Ui.toast(TONE_MESSAGES[tone], { tone })}
            >
              {STRINGS.show(tone)}
            </Ui.Button>
          ))}
        </div>
      </PageSection>

      <PageSection id="toast-options" title={STRINGS.options} note={STRINGS.optionsNote}>
        <div className={ROW}>
          <Ui.Button
            variant="secondary"
            onPress={() =>
              Ui.toast("Changes saved", {
                tone: "success",
                description: "Your profile is up to date.",
              })
            }
          >
            {STRINGS.withDescription}
          </Ui.Button>
          <Ui.Button
            variant="secondary"
            onPress={() =>
              Ui.toast("Order deleted", {
                action: {
                  label: "Undo",
                  onPress: () => Ui.toast.success("Order restored"),
                },
              })
            }
          >
            {STRINGS.withAction}
          </Ui.Button>
          <Ui.Button
            variant="secondary"
            onPress={() => Ui.toast("Upload paused", { tone: "warning", timeout: 0 })}
          >
            {STRINGS.staying}
          </Ui.Button>
          <Ui.Button
            variant="secondary"
            onPress={() => Ui.toast("Link copied", { tone: "accent", icon: "circle-check" })}
          >
            {STRINGS.ownIcon}
          </Ui.Button>
          <Ui.Button variant="secondary" onPress={() => Ui.toast("Link copied", { icon: false })}>
            {STRINGS.noIcon}
          </Ui.Button>
        </div>
      </PageSection>

      <PageSection id="toast-control" title={STRINGS.control} note={STRINGS.controlNote}>
        <div className={ROW}>
          <Ui.Switch label={STRINGS.atTop} value={isTop} onChange={setIsTop} />
          <Ui.Button
            variant="secondary"
            onPress={() => {
              Ui.toast.success("Saved");
              Ui.toast.info("Syncing");
              Ui.toast.warning("Offline");
            }}
          >
            {STRINGS.stack}
          </Ui.Button>
          <Ui.Button variant="ghost" onPress={() => Ui.toast.clear()}>
            {STRINGS.clear}
          </Ui.Button>
        </div>
      </PageSection>
    </article>
  );
}
