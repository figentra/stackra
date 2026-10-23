/**
 * Stackra file contract:
 * Purpose: the page of the icon-button route: every IconButton variant in every size, each named by its `label`, the
 *          disabled and loading states, and a live press counter, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. Icons are drawn by name
 *          through `Ui.Icon`, from the registry in `components/playground-icons` (ADR 0303 decision 10).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decisions 3 and 7); WCAG 2.2 SC 4.1.2 and 2.5.8.
 */
import { ButtonVariant, Size } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useEffect, useState } from "react";

import { PageSection } from "#src/components/page-section";
import { IconButtonRoute } from "#src/routes/icon-button/icon-button.route";

/** How long the live sample stays loading, in milliseconds. */
const LOADING_MILLISECONDS = 1500;

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::icon-button.*` keys.
const STRINGS = {
  documentTitle: `${IconButtonRoute.title} · Stackra Playground`,
  intro:
    "IconButton is a Button with one icon and no text. It has no visible name, so its label is required: screen readers read it in place of text.",
  variants: "Variants and sizes",
  variantsNote:
    "One row per size, one button per variant. The danger variants are labelled Delete, the others Settings.",
  size: (size: string) => `Size ${size}`,
  settings: "Settings",
  delete: "Delete",
  states: "States",
  statesNote: "Disabled, and loading: the icon gives way to a spinner and the size stays.",
  disabled: "Disabled",
  loading: "Loading",
  live: "Try it",
  liveNote: "Press the button to count; the loading one holds its press for a moment.",
  count: "Count presses",
  load: "Load",
  presses: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}.`,
  loadState: (isLoading: boolean) => (isLoading ? "Loading…" : "Idle."),
} as const;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The icon of a variant: danger variants delete, the rest open settings. */
const isDanger = (variant: ButtonVariant) => variant === "danger" || variant === "danger-soft";

/** The IconButton page. */
export function IconButton() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => setIsLoading(false), LOADING_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{IconButtonRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="icon-button-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
        {Size.map((size) => (
          <div key={size} className="grid gap-2">
            <Ui.Heading level={3}>{STRINGS.size(size)}</Ui.Heading>
            <ul className={ROW}>
              {ButtonVariant.map((variant) => (
                <li key={variant}>
                  <Ui.IconButton
                    variant={variant}
                    size={size}
                    label={isDanger(variant) ? STRINGS.delete : STRINGS.settings}
                    icon={isDanger(variant) ? "trash" : "settings"}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </PageSection>

      <PageSection id="icon-button-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <ul className={ROW}>
          <li>
            <Ui.IconButton isDisabled label={STRINGS.disabled} icon="settings" />
          </li>
          <li>
            <Ui.IconButton isLoading label={STRINGS.loading} icon="settings" />
          </li>
        </ul>
      </PageSection>

      <PageSection id="icon-button-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className={ROW}>
          <Ui.IconButton
            label={STRINGS.count}
            icon="settings"
            onPress={() => setCount((value) => value + 1)}
          />
          <output aria-live="polite" data-testid="press-count">
            <bdi>{STRINGS.presses(count)}</bdi>
          </output>
        </div>
        <div className={ROW}>
          <Ui.IconButton
            variant="secondary"
            label={STRINGS.load}
            icon="settings"
            isLoading={isLoading}
            onPress={() => setIsLoading(true)}
          />
          <Ui.Text role="status" tone="muted">
            <bdi>{STRINGS.loadState(isLoading)}</bdi>
          </Ui.Text>
        </div>
      </PageSection>
    </article>
  );
}
