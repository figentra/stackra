/**
 * Stackra file contract:
 * Purpose: the page of the spinner route: every size and tone, a labelled and a decorative spinner, one inline beside
 *          text, a slower spinner set by `className`, and a start-and-stop example announcing its result, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Size, TextTone } from "@stackra/ui/contracts";
import { Button, Heading, Spinner as UiSpinner, Text } from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";

import { PageSection } from "#src/components/page-section";
import { SpinnerRoute } from "#src/routes/spinner/spinner.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::spinner.*` keys.
const STRINGS = {
  documentTitle: `${SpinnerRoute.title} · Stackra Playground`,
  intro:
    "A Spinner is an indeterminate wait. With a label it is one named status; without one it is hidden from screen readers, so the text beside it says what is loading.",
  sizes: "Sizes",
  sizesNote: "Small, medium and large: 16, 24 and 32 pixels on web and native.",
  sizeLabel: (size: string) => `Loading, ${size}`,
  tones: "Tones",
  tonesNote: "One spinner per tone; each is drawn 3:1 or more against the page.",
  toneLabel: (tone: string) => `Loading, ${tone}`,
  beside: "Beside text",
  besideNote: "A decorative spinner: the muted text next to it carries the meaning.",
  results: "Loading results…",
  speed: "Speed",
  speedNote: "Slower, set by the caller with a class on web; it still stops under reduced motion.",
  slow: "Slower",
  action: "Start and stop",
  actionNote:
    "Press the button: a labelled spinner shows for a moment, then its result is announced.",
  load: "Load orders",
  loading: "Loading orders",
  loaded: "Orders loaded",
} as const;

/** How long the start-and-stop example waits, in milliseconds. */
const WAIT_MS = 1500;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/** The Spinner page. */
export function Spinner() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The timer is cleared on unmount, so a page left mid-wait never sets state afterwards.
  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    setIsLoading(true);
    setResult("");
    timer.current = setTimeout(() => {
      setIsLoading(false);
      setResult(STRINGS.loaded);
    }, WAIT_MS);
  };

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{SpinnerRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="spinner-sizes" title={STRINGS.sizes} note={STRINGS.sizesNote}>
        <div className={ROW}>
          {Size.map((size) => (
            <UiSpinner key={size} size={size} label={STRINGS.sizeLabel(size)} data-size={size} />
          ))}
        </div>
      </PageSection>

      <PageSection id="spinner-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
        <div className={ROW}>
          {TextTone.map((tone) => (
            <UiSpinner key={tone} tone={tone} label={STRINGS.toneLabel(tone)} data-tone={tone} />
          ))}
        </div>
      </PageSection>

      <PageSection id="spinner-beside" title={STRINGS.beside} note={STRINGS.besideNote}>
        <div className="flex items-center gap-2">
          <UiSpinner size="sm" tone="muted" />
          <Text tone="muted">{STRINGS.results}</Text>
        </div>
      </PageSection>

      <PageSection id="spinner-speed" title={STRINGS.speed} note={STRINGS.speedNote}>
        <div className="flex items-center gap-2">
          {/* Decorative: the text beside it names the wait. */}
          <UiSpinner className="animate-[spin_1.5s_linear_infinite] motion-reduce:animate-none" />
          <Text tone="muted">{STRINGS.slow}</Text>
        </div>
      </PageSection>

      <PageSection id="spinner-action" title={STRINGS.action} note={STRINGS.actionNote}>
        <div className={ROW}>
          <Button variant="secondary" isLoading={isLoading} onPress={start}>
            {STRINGS.load}
          </Button>
          {isLoading ? <UiSpinner label={STRINGS.loading} /> : null}
          <output aria-live="polite">{result}</output>
        </div>
      </PageSection>
    </article>
  );
}
