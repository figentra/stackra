/**
 * Stackra file contract:
 * Purpose: the page of the ChatLoader route: `@stackra/ui-pro`'s ChatLoader as three small indicators (dots, a pulse, a
 *          spinner), each announced as a status by its own name, and as a skeleton placeholder for a reply that has
 *          not arrived.
 * Boundary: presentation only. An indicator with a `label` is a named status; the skeleton is decorative, so it is
 *          hidden from assistive technology and the text beside it says what is loading.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { ProChatLoaderRoute } from "#src/routes/pro-chat-loader/pro-chat-loader.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-chat-loader.*` keys.
const STRINGS = {
  documentTitle: `${ProChatLoaderRoute.title} · Stackra Playground`,
  intro:
    "Loading states for an assistant's reply: three indicators for the moment before the first words, and a skeleton for a reply that is being laid out.",
  indicators: "Indicators",
  dots: "Dots",
  dotsLabel: "The assistant is typing",
  pulse: "Pulse",
  pulseLabel: "The assistant is thinking",
  spinner: "Spinner",
  spinnerLabel: "The assistant is loading",
  skeleton: "Skeleton",
  skeletonNote: "Waiting for the reply.",
} as const;

/** The ChatLoader page. */
export function ProChatLoader() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProChatLoaderRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="indicators-heading" className="grid max-w-md gap-3">
        <h2 id="indicators-heading" className="type-h2">
          {STRINGS.indicators}
        </h2>
        <ul className="grid gap-4">
          <li className="flex items-center gap-3">
            <span className="w-20 text-sm text-muted">{STRINGS.dots}</span>
            <UiPro.ChatLoader.Dots label={STRINGS.dotsLabel} />
          </li>
          <li className="flex items-center gap-3">
            <span className="w-20 text-sm text-muted">{STRINGS.pulse}</span>
            <UiPro.ChatLoader.Pulse label={STRINGS.pulseLabel} />
          </li>
          <li className="flex items-center gap-3">
            <span className="w-20 text-sm text-muted">{STRINGS.spinner}</span>
            <UiPro.ChatLoader.Spinner label={STRINGS.spinnerLabel} />
          </li>
        </ul>
      </section>
      <section aria-labelledby="skeleton-heading" className="grid max-w-md gap-3">
        <h2 id="skeleton-heading" className="type-h2">
          {STRINGS.skeleton}
        </h2>
        <p className="text-sm text-muted">{STRINGS.skeletonNote}</p>
        <UiPro.ChatLoader.Skeleton />
      </section>
    </article>
  );
}
