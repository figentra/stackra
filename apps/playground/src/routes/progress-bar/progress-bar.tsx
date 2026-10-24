/**
 * Stackra file contract:
 * Purpose: the page of the progress bar route: every size and tone, a bar at the start, the middle and the end of its
 *          range, an indeterminate bar, a bar with its label and value drawn, one in a custom range with its own value
 *          text, and an advance-and-reset example that announces its completion, all from `@stackra/ui/react` with real
 *          props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import { Size, Tone } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { ProgressBarRoute } from "#src/routes/progress-bar/progress-bar.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::progress-bar.*` keys.
const STRINGS = {
  documentTitle: `${ProgressBarRoute.title} · Stackra Playground`,
  intro:
    "A ProgressBar shows how far work has got. Give it a value for a determinate bar, or leave the value out for an indeterminate sweep. It is always a named progressbar, and it is not a Spinner: a Spinner only says that something is loading.",
  sizes: "Sizes",
  sizesNote: "Small, medium and large: 4, 8 and 12 pixels thick on web and native.",
  sizeLabel: (size: string) => `Upload, ${size}`,
  tones: "Tones",
  tonesNote: "One bar per tone; each fill is drawn 3:1 or more against the page.",
  toneLabel: (tone: string) => `Upload, ${tone}`,
  determinate: "Determinate",
  determinateNote:
    "The start, the middle and the end of the range; the fill starts at the inline start.",
  valueLabel: (value: number) => `Upload at ${value} per cent`,
  indeterminate: "Indeterminate",
  indeterminateNote:
    "No value: a segment sweeps along the track, and it rests as a still segment under reduced motion.",
  indeterminateLabel: "Preparing upload",
  text: "Label and value",
  textNote:
    "The label and the value can be drawn above the bar. A custom range and value text say what the number means.",
  storage: "Storage used",
  files: "Uploading invoices",
  filesText: "3 of 12 files",
  action: "Advance and reset",
  actionNote:
    "Press Advance to add 10 per cent; at the end the completion is announced. Reset starts again.",
  actionLabel: "Upload progress",
  advance: "Advance by 10%",
  reset: "Reset",
  complete: "Upload complete",
} as const;

/** How much each press of Advance adds, in per cent. */
const STEP = 10;

/** The column that holds bars, narrow enough to read as a bar on a wide screen. */
const COLUMN = "grid max-w-md gap-4";

/** The ProgressBar page. */
export function ProgressBar() {
  const [value, setValue] = useState(0);
  const advance = () => setValue((current) => Math.min(100, current + STEP));

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{ProgressBarRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="progress-bar-sizes" title={STRINGS.sizes} note={STRINGS.sizesNote}>
        <div className={COLUMN}>
          {Size.map((size) => (
            <Ui.ProgressBar
              key={size}
              size={size}
              value={60}
              label={STRINGS.sizeLabel(size)}
              data-size={size}
            />
          ))}
        </div>
      </PageSection>

      <PageSection id="progress-bar-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
        <div className={COLUMN}>
          {Tone.map((tone) => (
            <Ui.ProgressBar
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
        id="progress-bar-determinate"
        title={STRINGS.determinate}
        note={STRINGS.determinateNote}
      >
        <div className={COLUMN}>
          {[0, 40, 100].map((step) => (
            <Ui.ProgressBar
              key={step}
              value={step}
              label={STRINGS.valueLabel(step)}
              data-value={step}
            />
          ))}
        </div>
      </PageSection>

      <PageSection
        id="progress-bar-indeterminate"
        title={STRINGS.indeterminate}
        note={STRINGS.indeterminateNote}
      >
        <div className={COLUMN}>
          <Ui.ProgressBar label={STRINGS.indeterminateLabel} data-indeterminate />
        </div>
      </PageSection>

      <PageSection id="progress-bar-text" title={STRINGS.text} note={STRINGS.textNote}>
        <div className={COLUMN}>
          <Ui.ProgressBar value={72} label={STRINGS.storage} isLabelVisible isValueVisible />
          <Ui.ProgressBar
            value={3}
            maxValue={12}
            valueLabel={STRINGS.filesText}
            label={STRINGS.files}
            tone="success"
            isLabelVisible
            isValueVisible
          />
        </div>
      </PageSection>

      <PageSection id="progress-bar-action" title={STRINGS.action} note={STRINGS.actionNote}>
        <div className={COLUMN}>
          <Ui.ProgressBar
            value={value}
            label={STRINGS.actionLabel}
            tone={value >= 100 ? "success" : "accent"}
            isLabelVisible
            isValueVisible
          />
          <div className="flex flex-wrap items-center gap-4">
            <Ui.Button variant="secondary" onPress={advance}>
              {STRINGS.advance}
            </Ui.Button>
            <Ui.Button variant="tertiary" onPress={() => setValue(0)}>
              {STRINGS.reset}
            </Ui.Button>
            <output aria-live="polite">{value >= 100 ? STRINGS.complete : ""}</output>
          </div>
        </div>
      </PageSection>
    </article>
  );
}
