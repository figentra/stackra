/**
 * Stackra file contract:
 * Purpose: `StackraSection`, what Stackra adds over HeroUI: the usage demo twice, left to right beside right to left
 *          (Arabic), the same demo in three brand frames (`data-brand`, recoloured once the brand layer's CSS is
 *          attribute-scoped, WP3), the design tokens it reads as chips linking to the Theme Studio, the haptics it
 *          plays on native, and the HeroUI props its contract replaces.
 * Boundary: the frames mount the `card` demo (the usage one when none is marked) live, each a `PreviewFrame`: a named
 *           region ("Arabic preview", "Organza preview"), its own language's words, `useId` ids, overlays portalled
 *           into the frame so they keep its brand, mounted once scrolled near; each sub-block is left out when the
 *           entry has nothing for it.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 4 (row 10) and 8.
 */
import { Card, Chip, Heading, Link, useCatalogueText, useDesignSystem } from "@stackra/ui/react";
import type { ReactElement } from "react";
import { useLocation } from "react-router";

import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import type { StackraSectionProps } from "#src/components/component-page/stackra-section.props";
import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import { PreviewFrame } from "#src/components/preview-frame";
import { BRAND_THEMES } from "#src/constants/brand-themes";
import { MESSAGES } from "#src/constants/messages.constant";
import { demoPath } from "#src/demos";

const K = COMPONENT_PAGE_KEYS.showcase;
const D = DOC_PAGE_KEYS.showcase.doc.ui;

/** The brand frames, in the order the spec names them. */
const BRANDS = BRAND_THEMES.filter(({ id }) => ["figentra", "organza", "jute"].includes(id));

/** The directions of the RTL preview: the Arabic frame carries its language. */
const FRAMES = [
  // Named by direction: the Right-to-left section's frame is already "Arabic preview" (or "English preview").
  { dir: "ltr", lang: "en", label: D.rtl_preview_ltr },
  { dir: "rtl", lang: "ar", label: D.rtl_preview_rtl },
] as const;

// inline-size containment: a wide demo never widens the page (it is clipped to its frame); a query container, so a
// demo laid out by `@md:` container variants fits its frame, not the window.
/** Frames that drop a column before they squeeze their demo: as many 22rem columns as fit. */
const PAIR_GRID = "grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))]";
const FRAME =
  "@container grid min-w-0 place-items-center overflow-hidden [contain:inline-size] bg-background p-4 text-foreground";

/** The Stackra additions of an entry. */
export function StackraSection({ entry, apiDoc }: StackraSectionProps): ReactElement {
  const t = useCatalogueText(MESSAGES.en);
  const language = useDesignSystem().locale.startsWith("ar") ? "ar" : "en";
  const { search } = useLocation();
  const demo = entry.examples.find((example) => example.card) ?? entry.examples[0];
  const path = demo ? demoPath(entry, demo.id) : undefined;
  const replaced = (apiDoc?.parts ?? []).flatMap((part) =>
    part.props.filter((prop) => prop.replaces).map((prop) => ({ part: part.name, ...prop })),
  );
  return (
    <div className="grid gap-6">
      {path ? (
        <div className="grid gap-3">
          <Heading level={3}>{t(K.stackra.rtl)}</Heading>
          <div className={PAIR_GRID}>
            {FRAMES.map((frame) => (
              <Card key={frame.dir} className="min-w-0 overflow-hidden p-0">
                <PreviewFrame
                  path={path}
                  label={t(frame.label)}
                  dir={frame.dir}
                  lang={frame.lang}
                  className={FRAME}
                />
              </Card>
            ))}
          </div>
        </div>
      ) : null}
      {path ? (
        <div className="grid gap-3">
          <Heading level={3}>{t(K.stackra.brands)}</Heading>
          <div className={PAIR_GRID}>
            {BRANDS.map((brand) => (
              <Card key={brand.id} className="min-w-0 overflow-hidden p-0">
                <PreviewFrame
                  path={path}
                  label={t(D.rtl_preview_brand, { brand: brand.name[language] })}
                  dir={language === "ar" ? "rtl" : "ltr"}
                  lang={language}
                  brand={brand}
                  caption={
                    <span aria-hidden="true" className="text-xs text-muted">
                      <bdi>{brand.name[language]}</bdi>
                    </span>
                  }
                  className={`${FRAME} grid-rows-[auto_1fr] gap-2`}
                />
              </Card>
            ))}
          </div>
        </div>
      ) : null}
      {entry.tokens.length ? (
        <div className="grid gap-3">
          <Heading level={3}>{t(K.stackra.tokens)}</Heading>
          <ul className="flex flex-wrap gap-2">
            {entry.tokens.map((token) => (
              <li key={token}>
                <Link
                  href={`/theme-studio${search}`}
                  underline="hover"
                  className="hover:no-underline"
                >
                  <Chip variant="soft">
                    <code dir="ltr" className="font-mono text-xs">
                      {token}
                    </code>
                  </Chip>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {entry.haptics?.length ? (
        <div className="grid gap-3">
          <Heading level={3}>{t(K.stackra.haptics)}</Heading>
          <ul className="flex flex-wrap gap-2">
            {entry.haptics.map((haptic) => (
              <li key={haptic.event} className="flex items-center gap-2">
                <code dir="ltr" className="font-mono text-xs">
                  {haptic.event}
                </code>
                <Chip size="sm" variant="soft" tone="accent">
                  {t(K.haptic[haptic.style])}
                </Chip>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {replaced.length ? (
        <div className="grid gap-3">
          <Heading level={3}>{t(K.stackra.replaced_props)}</Heading>
          <ul className="grid gap-1">
            {replaced.map((prop) => (
              <li key={`${prop.part}.${prop.name}`} className="flex flex-wrap items-center gap-2">
                <code dir="ltr" className="font-mono text-xs">
                  {`${prop.part}.${prop.name}`}
                </code>
                <Chip size="sm" variant="soft">
                  {t(K.api.replaces, { prop: prop.replaces })}
                </Chip>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
