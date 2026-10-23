/**
 * Stackra file contract:
 * Purpose: the page of the progress circle route: every size and tone, a ring from empty to full, an indeterminate
 *          ring, one beside text, one with the caller's value text, and an advance-and-reset example that announces its
 *          completion, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import { Size, Tone } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { ProgressCircleRoute } from "#src/routes/progress-circle/progress-circle.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::progress-circle.*` keys.
const STRINGS = {
  documentTitle: `${ProgressCircleRoute.title} · Stackra Playground`,
  intro:
    "A ProgressCircle shows how far work has got in a small space. Give it a value for a determinate ring, or leave the value out for an indeterminate spin. It draws no text, so its name and value are spoken; put the number beside it when people need to see it. It is not a Spinner: a Spinner only says that something is loading.",
  sizes: "Sizes",
  sizesNote: "Small, medium and large: 20, 28 and 36 pixels across on web and native.",
  sizeLabel: (size: string) => `Sync, ${size}`,
  tones: "Tones",
  tonesNote: "One ring per tone; each fill is drawn 3:1 or more against the page.",
  toneLabel: (tone: string) => `Sync, ${tone}`,
  determinate: "Determinate",
  determinateNote: "From empty to full; the arc starts at the top and runs clockwise.",
  valueLabel: (value: number) => `Sync at ${value} per cent`,
  indeterminate: "Indeterminate",
  indeterminateNote:
    "No value: a quarter arc spins, and it rests as a still arc under reduced motion.",
  indeterminateLabel: "Preparing sync",
  beside: "Beside text",
  besideNote: "The ring is named; the text next to it shows the number and the state.",
  besideLabel: "Syncing contacts",
  besideText: "6 of 8 contacts",
  action: "Advance and reset",
  actionNote:
    "Press Advance to add 10 per cent; at the end the completion is announced. Reset starts again.",
  actionLabel: "Sync progress",
  advance: "Advance by 10%",
  reset: "Reset",
  complete: "Sync complete",
} as const;

/** How much each press of Advance adds, in per cent. */
const STEP = 10;

/** The row that lays rings out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/** The ProgressCircle page. */
export function ProgressCircle() {
  const [value, setValue] = useState(0);
  const advance = () => setValue((current) => Math.min(100, current + STEP));

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{ProgressCircleRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="progress-circle-sizes" title={STRINGS.sizes} note={STRINGS.sizesNote}>
        <div className={ROW}>
          {Size.map((size) => (
            <Ui.ProgressCircle
              key={size}
              size={size}
              value={60}
              label={STRINGS.sizeLabel(size)}
              data-size={size}
            />
          ))}
        </div>
      </PageSection>

      <PageSection id="progress-circle-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
        <div className={ROW}>
          {Tone.map((tone) => (
            <Ui.ProgressCircle
              key={tone}
              tone={tone}
              value={60}
              label={STRINGS.toneLabel(tone)}
              data-tone={tone}
            />
          ))}
        </div>
      </PageSection>

      <PageSection
        id="progress-circle-determinate"
        title={STRINGS.determinate}
        note={STRINGS.determinateNote}
      >
        <div className={ROW}>
          {[0, 25, 50, 75, 100].map((step) => (
            <Ui.ProgressCircle
              key={step}
              size="lg"
              value={step}
              label={STRINGS.valueLabel(step)}
              data-value={step}
            />
          ))}
        </div>
      </PageSection>

      <PageSection
        id="progress-circle-indeterminate"
        title={STRINGS.indeterminate}
        note={STRINGS.indeterminateNote}
      >
        <div className={ROW}>
          <Ui.ProgressCircle label={STRINGS.indeterminateLabel} data-indeterminate />
        </div>
      </PageSection>

      <PageSection id="progress-circle-beside" title={STRINGS.beside} note={STRINGS.besideNote}>
        <div className="flex items-center gap-2">
          <Ui.ProgressCircle size="sm" value={75} label={STRINGS.besideLabel} />
          <Ui.Text tone="muted">{STRINGS.besideText}</Ui.Text>
        </div>
      </PageSection>

      <PageSection id="progress-circle-action" title={STRINGS.action} note={STRINGS.actionNote}>
        <div className={ROW}>
          <Ui.ProgressCircle
            size="lg"
            value={value}
            label={STRINGS.actionLabel}
            tone={value >= 100 ? "success" : "accent"}
          />
          <Ui.Button variant="secondary" onPress={advance}>
            {STRINGS.advance}
          </Ui.Button>
          <Ui.Button variant="tertiary" onPress={() => setValue(0)}>
            {STRINGS.reset}
          </Ui.Button>
          <output aria-live="polite">{value >= 100 ? STRINGS.complete : ""}</output>
        </div>
      </PageSection>
    </article>
  );
}
