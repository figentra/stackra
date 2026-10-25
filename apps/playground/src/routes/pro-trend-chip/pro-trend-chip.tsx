/**
 * Stackra file contract:
 * Purpose: the page of the TrendChip route: `@stackra-pro/ui`'s TrendChip in each direction (up, down, neutral) in
 *          each size, in each variant, and with a prefix and a suffix; each chip names its direction in words, since
 *          HeroUI Pro conveys it by an arrow and a colour only.
 * Boundary: presentation only. The direction word is visually hidden text in the chip's suffix. Values are isolated
 *          left to right (`<bdi>`) so a right-to-left page keeps their signs readable.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0060 (light, dark, RTL); STA-403 FR-013.
 */
import { Size } from "@stackra/ui/contracts";
import { TrendChipVariant } from "@stackra-pro/ui/contracts";
import * as UiPro from "@stackra-pro/ui/react";
import type { ReactNode } from "react";

import { ProTrendChipRoute } from "#src/routes/pro-trend-chip/pro-trend-chip.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-trend-chip.*` keys.
const STRINGS = {
  documentTitle: `${ProTrendChipRoute.title} · Stackra Playground`,
  intro:
    "A chip for a change and its direction. Each chip says its direction in words for assistive technology, besides the arrow and the colour.",
  sizes: "Sizes",
  variants: "Variants",
  context: "With a prefix and a suffix",
  direction: { up: "Trending up", down: "Trending down", neutral: "No change" },
  value: { up: "+3.3%", down: "-2.1%", neutral: "0.0%" },
  money: "+$1,234",
  period: "vs last month",
} as const;

const TRENDS = ["up", "down", "neutral"] as const;

/** A chip in one direction, with its direction as visually hidden text after the value. */
function Chip({
  trend,
  children,
  ...props
}: Omit<UiPro.TrendChipProps, "trend" | "children"> & {
  trend: (typeof TRENDS)[number];
  children?: ReactNode;
}) {
  return (
    <UiPro.TrendChip trend={trend} {...props}>
      {children ?? STRINGS.value[trend]}
      <UiPro.TrendChip.Suffix>
        <span className="sr-only">{STRINGS.direction[trend]}</span>
      </UiPro.TrendChip.Suffix>
    </UiPro.TrendChip>
  );
}

/** A labelled row of chips. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3">
      <span className="w-24 text-sm text-muted">
        <bdi>{label}</bdi>
      </span>
      {children}
    </li>
  );
}

/** The TrendChip page. */
export function ProTrendChip() {
  return (
    <article className="grid gap-8">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProTrendChipRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="sizes-heading" className="grid gap-3">
        <h2 id="sizes-heading" className="type-h2">
          {STRINGS.sizes}
        </h2>
        <ul className="grid gap-3">
          {Size.map((size) => (
            <Row key={size} label={size}>
              {TRENDS.map((trend) => (
                <Chip key={trend} trend={trend} size={size} />
              ))}
            </Row>
          ))}
        </ul>
      </section>
      <section aria-labelledby="variants-heading" className="grid gap-3">
        <h2 id="variants-heading" className="type-h2">
          {STRINGS.variants}
        </h2>
        <ul className="grid gap-3">
          {TrendChipVariant.map((variant) => (
            <Row key={variant} label={variant}>
              {TRENDS.map((trend) => (
                <Chip key={trend} trend={trend} variant={variant} />
              ))}
            </Row>
          ))}
        </ul>
      </section>
      <section aria-labelledby="context-heading" className="grid gap-3">
        <h2 id="context-heading" className="type-h2">
          {STRINGS.context}
        </h2>
        <ul className="grid gap-3">
          <Row label="up">
            <UiPro.TrendChip trend="up">
              <UiPro.TrendChip.Prefix>+$</UiPro.TrendChip.Prefix>
              1,234
              <UiPro.TrendChip.Suffix>
                {STRINGS.period}
                <span className="sr-only">, {STRINGS.direction.up}</span>
              </UiPro.TrendChip.Suffix>
            </UiPro.TrendChip>
          </Row>
        </ul>
      </section>
    </article>
  );
}
