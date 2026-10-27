/**
 * Stackra file contract:
 * Purpose: the page of the button route: every Button variant in every size, the disabled and loading states, start,
 *          end and both icons, a direction-aware chevron, full width, and live samples (a save that loads for a
 *          moment, a press counter), all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. Icons are drawn by name
 *          through `Icon`, from the registry in `components/playground-icons` (ADR 0303 decision 10).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decisions 3 and 7); ADR 0060 (right-to-left).
 */
import { ButtonVariant, Size } from "@stackra/ui/contracts";
import { Button as UiButton, Heading, Icon, Text } from "@stackra/ui/react";
import { useEffect, useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { ButtonRoute } from "#src/routes/button/button.route";

/** How long the live save stays loading, in milliseconds. */
const SAVE_MILLISECONDS = 1500;

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::button.*` keys.
const STRINGS = {
  documentTitle: `${ButtonRoute.title} · Stackra Playground`,
  intro:
    "Button is HeroUI's button with one props API on web and native: seven variants, three sizes, a disabled and a loading state, icons on either side and a full-width form. The look is HeroUI's, themed by the stackra tokens.",
  variants: "Variants and sizes",
  variantsNote: "One row per size, one button per variant, each labelled with its variant name.",
  size: (size: string) => `Size ${size}`,
  states: "States",
  statesNote:
    "Each variant default, disabled and loading. A loading button refuses presses and keeps focus.",
  default: "Default",
  disabled: "Disabled",
  loading: "Loading",
  icons: "Icons",
  iconsNote:
    "An icon on the inline-start side, the inline-end side or both. The chevron is mirrored in right-to-left: switch to Arabic.",
  add: "Add",
  next: "Next",
  download: "Download",
  fullWidth: "Full width",
  fullWidthNote: "The button stretches to its container, here a narrow column.",
  primary: "Primary",
  secondary: "Secondary",
  live: "Try it",
  liveNote:
    "Press Save: it loads for a moment and keeps focus. The counter button counts presses; the disabled one does not.",
  save: "Save",
  saveState: (isSaving: boolean) => (isSaving ? "Saving…" : "Idle."),
  count: "Count",
  countDisabled: "Count (disabled)",
  presses: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}.`,
} as const;

/** A sample with its caption underneath, the caption isolated left to right. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid justify-items-start gap-2">
      {children}
      <Text type="small" tone="muted">
        <bdi dir="ltr">{caption}</bdi>
      </Text>
    </li>
  );
}

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-4";

/** The Button page. */
export function Button() {
  const [isSaving, setIsSaving] = useState(false);
  const [count, setCount] = useState(0);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isSaving) return undefined;
    const timer = setTimeout(() => setIsSaving(false), SAVE_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isSaving]);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{ButtonRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="button-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
        {Size.map((size) => (
          <div key={size} className="grid gap-2">
            <Heading level={3}>{STRINGS.size(size)}</Heading>
            <ul className={ROW}>
              {ButtonVariant.map((variant) => (
                <li key={variant}>
                  <UiButton variant={variant} size={size}>
                    {variant}
                  </UiButton>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </PageSection>

      <PageSection id="button-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <ul className="grid gap-4">
          {ButtonVariant.map((variant) => (
            <li key={variant} className="grid gap-2">
              <Text type="small" tone="muted">
                <bdi dir="ltr">{variant}</bdi>
              </Text>
              <div className={ROW}>
                <UiButton variant={variant}>{STRINGS.default}</UiButton>
                <UiButton variant={variant} isDisabled>
                  {STRINGS.disabled}
                </UiButton>
                <UiButton variant={variant} isLoading>
                  {STRINGS.loading}
                </UiButton>
              </div>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection id="button-icons" title={STRINGS.icons} note={STRINGS.iconsNote}>
        <ul className={ROW}>
          <Sample caption="startIcon">
            <UiButton variant="secondary" startIcon="plus">
              {STRINGS.add}
            </UiButton>
          </Sample>
          <Sample caption="endIcon">
            <UiButton variant="secondary" endIcon={<Icon name="chevron-right" isMirroredInRtl />}>
              {STRINGS.next}
            </UiButton>
          </Sample>
          <Sample caption="startIcon + endIcon">
            <UiButton
              variant="secondary"
              startIcon="download"
              endIcon={<Icon name="chevron-right" isMirroredInRtl />}
            >
              {STRINGS.download}
            </UiButton>
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="button-full-width" title={STRINGS.fullWidth} note={STRINGS.fullWidthNote}>
        <div className="grid max-w-sm gap-3">
          <UiButton isFullWidth>{STRINGS.primary}</UiButton>
          <UiButton variant="secondary" isFullWidth>
            {STRINGS.secondary}
          </UiButton>
        </div>
      </PageSection>

      <PageSection id="button-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="flex flex-wrap items-center gap-4">
          <UiButton isLoading={isSaving} onPress={() => setIsSaving(true)}>
            {STRINGS.save}
          </UiButton>
          <output aria-live="polite" data-testid="save-state">
            <bdi>{STRINGS.saveState(isSaving)}</bdi>
          </output>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <UiButton onPress={() => setCount((value) => value + 1)}>{STRINGS.count}</UiButton>
          <UiButton isDisabled onPress={() => setCount((value) => value + 1)}>
            {STRINGS.countDisabled}
          </UiButton>
          <output aria-live="polite" data-testid="press-count">
            <bdi>{STRINGS.presses(count)}</bdi>
          </output>
        </div>
      </PageSection>
    </article>
  );
}
