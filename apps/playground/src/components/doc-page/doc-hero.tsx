/**
 * Stackra file contract:
 * Purpose: `DocHero`, the informative hero of every component and category page: eyebrow, title with its chips,
 *          the benefit-led headline, a short paragraph, tags, "Suggest an improvement" and a live signature demo
 *          beside it (below it on a phone). It rises in once; reduced motion shows it in place (`.doc-rise`).
 * Boundary: presentation; every word comes in translated from the catalogue.
 * Runtime: browser
 * Governing contract: STA-1371 (doc pages wave, owner approval 2026-10-28); ADR 0060 (RTL).
 */
import { suggestUrl } from "@stackra/showcase";
import { Card, Chip, Heading, Link, Text, useCatalogueText } from "@stackra/ui/react";
import type { CSSProperties } from "react";

import type { DocHeroProps } from "#src/components/doc-page/doc-hero.props";
import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import { tagList } from "#src/components/doc-page/tag-list.function";
import { MESSAGES } from "#src/constants/messages.constant";

const K = DOC_PAGE_KEYS.showcase.doc.ui;

/** The stagger step of a rising block. */
const step = (value: number) => ({ "--rise-step": value }) as CSSProperties;

/** The hero of a doc page. */
export function DocHero({
  eyebrow,
  title,
  chips,
  headline,
  intro,
  tags,
  page,
  actions,
  demo,
  footer,
}: DocHeroProps) {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <header
      id="header"
      className={`grid gap-6 scroll-mt-24 ${demo ? "lg:grid-cols-[minmax(0,1fr)_clamp(22rem,44%,36rem)] lg:items-center" : ""}`}
    >
      <div className="grid min-w-0 gap-3">
        <div className="doc-rise flex flex-wrap items-start justify-between gap-3" style={step(0)}>
          <Text type="small" tone="muted" className="font-medium">
            {eyebrow}
          </Text>
          {actions}
        </div>
        <div className="doc-rise flex flex-wrap items-center gap-2" style={step(1)}>
          <Heading level={1}>{title}</Heading>
          {chips}
        </div>
        <Text className="doc-rise text-xl font-semibold text-balance" style={step(2)}>
          <bdi>{headline}</bdi>
        </Text>
        <Text tone="muted" className="doc-rise max-w-prose" style={step(3)}>
          <bdi>{intro}</bdi>
        </Text>
        <ul className="doc-rise flex flex-wrap gap-2" style={step(4)}>
          {tagList(tags).map((tag) => (
            <li key={tag}>
              <Chip size="sm" variant="soft">
                {tag}
              </Chip>
            </li>
          ))}
        </ul>
        <div className="doc-rise flex flex-wrap items-center gap-x-4 gap-y-2" style={step(5)}>
          {footer}
          <Link href={suggestUrl(page)} isExternal underline="hover">
            {t(K.suggest)}
          </Link>
        </div>
      </div>
      {demo ? (
        <Card
          className="doc-rise min-w-0 overflow-hidden p-0 [contain:inline-size]"
          style={step(3)}
        >
          {/* A showcase copy of an example the page renders again below: kept out of the a11y tree and tab
              order so its headings and landmarks don't duplicate the page's (axe heading-order, landmark-unique). */}
          <div
            aria-hidden
            inert
            // A glimpse at a fixed 20rem, cropped with a soft fade: fixed, so the hero neither grows as the demo loads
            // nor shifts the page. The full demo is drawn again under Usage, and an uncapped one (the whole token
            // palette) stretched the hero thousands of pixels. Safe centring keeps a demo wider or taller than the card
            // anchored at its start instead of cut on both sides. The crop is a scroll region with no scrollbar (inert,
            // so nobody scrolls it): axe confines what a scroll region holds to its box, while an overflow-hidden crop
            // let the hidden overflow lie over the pillars below.
            className="relative grid h-80 overflow-auto bg-background [scrollbar-width:none] p-6 [mask-image:linear-gradient(to_bottom,black_calc(100%-2.5rem),transparent)] [place-items:safe_center]"
          >
            <span className="stage-dots" />
            {demo}
          </div>
        </Card>
      ) : null}
    </header>
  );
}
