/**
 * Stackra file contract:
 * Purpose: the page of the TextShimmer route: `@stackra-pro/ui`'s TextShimmer on two short labels ("Thinking..." and
 *          "Generating response...") and on a muted label, text with a highlight that sweeps across it while work goes on.
 * Boundary: presentation only. The text is real text, so it reads as it is; under reduced motion the highlight is
 *          removed and the text is solid. The muted label uses the page's muted text colour.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";

import { ProTextShimmerRoute } from "#src/routes/pro-text-shimmer/pro-text-shimmer.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-text-shimmer.*` keys.
const STRINGS = {
  documentTitle: `${ProTextShimmerRoute.title} · Stackra Playground`,
  intro:
    "A short label with a moving highlight, for an assistant that is thinking, generating or working in the background.",
  labels: "Labels",
  muted: "Muted",
  thinking: "Thinking...",
  generating: "Generating response...",
  searching: "Searching the documents...",
} as const;

/** The TextShimmer page. */
export function ProTextShimmer() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProTextShimmerRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="labels-heading" className="grid gap-3">
        <h2 id="labels-heading" className="type-h2">
          {STRINGS.labels}
        </h2>
        <ul className="grid gap-4 text-sm">
          <li>
            <UiPro.TextShimmer>{STRINGS.thinking}</UiPro.TextShimmer>
          </li>
          <li>
            <UiPro.TextShimmer>{STRINGS.generating}</UiPro.TextShimmer>
          </li>
        </ul>
      </section>
      <section aria-labelledby="muted-heading" className="grid gap-3">
        <h2 id="muted-heading" className="type-h2">
          {STRINGS.muted}
        </h2>
        <p className="text-sm">
          <UiPro.TextShimmer className="text-muted">{STRINGS.searching}</UiPro.TextShimmer>
        </p>
      </section>
    </article>
  );
}
