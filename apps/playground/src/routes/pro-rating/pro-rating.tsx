/**
 * Stackra file contract:
 * Purpose: the page of the Rating route: `@stackra-pro/ui`'s Rating as an input of five stars, each named by its
 *          value, that reports the rating chosen, and as read-only ratings, one with a fractional value that is also
 *          written out as text.
 * Boundary: presentation and local state only. A read-only rating is announced with its value in a label, since the
 *          stars alone do not say it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProRatingRoute } from "#src/routes/pro-rating/pro-rating.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-rating.*` keys.
const STRINGS = {
  documentTitle: `${ProRatingRoute.title} · Stackra Playground`,
  intro:
    "A star rating. Choose a rating with a press or the arrow keys; a read-only rating shows a value, including a part of a star.",
  input: "Your rating",
  inputLabel: "Rate this release",
  chosen: (value: number) => `You rated it ${value} ${value === 1 ? "star" : "stars"}.`,
  readOnly: "Average rating",
  average: "Average rating: 3.5 out of 5",
  averageText: "3.5 out of 5 from 128 reviews",
  star: (value: number) => `${value} ${value === 1 ? "star" : "stars"}`,
} as const;

const VALUES = [1, 2, 3, 4, 5] as const;

/** The Rating page. */
export function ProRating() {
  const [value, setValue] = useState(3);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProRatingRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="input-heading" className="grid gap-3">
        <h2 id="input-heading" className="type-h2">
          {STRINGS.input}
        </h2>
        <div>
          <UiPro.Rating label={STRINGS.inputLabel} value={value} onValueChange={setValue}>
            {VALUES.map((star) => (
              <UiPro.Rating.Item key={star} value={star} aria-label={STRINGS.star(star)} />
            ))}
          </UiPro.Rating>
        </div>
        <p role="status">
          <bdi>{STRINGS.chosen(value)}</bdi>
        </p>
      </section>
      <section aria-labelledby="readonly-heading" className="grid gap-3">
        <h2 id="readonly-heading" className="type-h2">
          {STRINGS.readOnly}
        </h2>
        <div className="flex items-center gap-3">
          <UiPro.Rating label={STRINGS.average} value={3.5} isReadOnly>
            {VALUES.map((star) => (
              <UiPro.Rating.Item key={star} value={star} aria-label={STRINGS.star(star)} />
            ))}
          </UiPro.Rating>
          <span className="text-sm">
            <bdi>{STRINGS.averageText}</bdi>
          </span>
        </div>
      </section>
    </article>
  );
}
