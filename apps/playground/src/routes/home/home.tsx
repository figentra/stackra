/**
 * Stackra file contract:
 * Purpose: the page of the index route, the playground's landing: a hero (what the system is, its numbers, and the
 *          ways in: browse or search), a live showcase of scenes composed from @stackra/ui, and the gallery of every
 *          page by category with its Free / Pro filter. It titles the document.
 * Boundary: presentation only; the pages come from the route tree in `main.tsx`, and the search opens the shell's
 *          command palette through the outlet context.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14, rule R7).
 */
import * as Ui from "@stackra/ui/react";
import { useEffect } from "react";
import { useLocation, useOutletContext } from "react-router";

import { HeroArt } from "#src/components/hero-art";
import { PageGallery } from "#src/components/page-gallery";
import { Showcase } from "#src/components/showcase";
import { HomeRoute } from "#src/routes/home/home.route";
import type { PageLink } from "#src/types/page-link.type";
import type { ShellContext } from "#src/types/shell-context.type";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::home.*` keys.
const STRINGS = {
  eyebrow: "Playground",
  brand: "Stackra",
  product: "Design System",
  intro:
    "Every component, live, in light and dark and in English and Arabic. Built on HeroUI and drawn in the Stackra tokens; the view you pick stays in the address, so a link opens the same one.",
  browse: "Browse components",
  search: "Search",
  stats: {
    pages: (count: number) => `${count} pages`,
    categories: (count: number) => `${count} categories`,
    schemes: "Light and dark",
    directions: "LTR and RTL",
  },
  showcase: "In use",
  showcaseNote: "Three small scenes built only from the system's components. Try them.",
  components: "Components",
  componentsNote: "Every page, grouped by category. Free pages come first; Pro pages wear a badge.",
} as const;

/** Props of {@link Home}. */
export interface HomeProps {
  /** The pages to list, in order. */
  pages: readonly PageLink[];
}

/** The landing page: hero, showcase and gallery. */
export function Home({ pages }: HomeProps) {
  const { search, hash, key } = useLocation();
  // A client-side link to `#components` changes the hash without scrolling, so the page scrolls to it, again on a
  // second press of the same link (a new location key).
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView?.();
  }, [hash, key]);
  // Undefined outside the shell (a unit test renders the page alone): the search button is left out then.
  const shell = useOutletContext<ShellContext | undefined>();
  const categories = new Set(pages.map((page) => page.category)).size;
  const stats = [
    STRINGS.stats.pages(pages.length),
    STRINGS.stats.categories(categories),
    STRINGS.stats.schemes,
    STRINGS.stats.directions,
  ];

  return (
    <article className="grid gap-16 pb-8">
      <title>{HomeRoute.title}</title>
      <header className="grid justify-items-center gap-6 pt-4 text-center sm:pt-8">
        <HeroArt />
        <Ui.Chip variant="soft" size="sm" startIcon="sparkles">
          {STRINGS.eyebrow}
        </Ui.Chip>
        {/* The stage above draws the name as the wordmark, so the heading shows the rest of it; its text, which
            titles the document, is the whole name. */}
        <Ui.Heading
          level={1}
          align="center"
          className="[font:var(--display)] tracking-[-0.035em] text-balance"
        >
          <span className="sr-only">{STRINGS.brand}</span> {STRINGS.product}
        </Ui.Heading>
        {/* <bdi>: an English sentence keeps its full stop at its end inside a right-to-left page. */}
        <p className="max-w-2xl text-lg text-muted text-pretty">
          <bdi>{STRINGS.intro}</bdi>
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Ui.Link
            href={`/${search}#components`}
            underline="hover"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-5 font-medium text-accent-foreground! hover:bg-accent-hover hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {STRINGS.browse}
            <Ui.Icon name="arrow-right" size="sm" isMirroredInRtl />
          </Ui.Link>
          {shell ? (
            <Ui.Button
              variant="outline"
              startIcon="search"
              onPress={shell.openPalette}
              className="glass rounded-full"
            >
              {STRINGS.search}
            </Ui.Button>
          ) : null}
        </div>
        <ul className="flex flex-wrap justify-center gap-2 text-sm">
          {stats.map((stat) => (
            <li key={stat} className="glass rounded-full px-3 py-1">
              <bdi>{stat}</bdi>
            </li>
          ))}
        </ul>
      </header>

      <section aria-labelledby="home-showcase" className="grid gap-4">
        <div className="grid gap-1">
          <Ui.Heading id="home-showcase" level={2}>
            {STRINGS.showcase}
          </Ui.Heading>
          <Ui.Text tone="muted">
            <bdi>{STRINGS.showcaseNote}</bdi>
          </Ui.Text>
        </div>
        <Showcase headingLevel={3} />
      </section>

      <section
        id="components"
        aria-labelledby="home-components"
        className="grid scroll-mt-24 gap-4"
      >
        <div className="grid gap-1">
          <Ui.Heading id="home-components" level={2}>
            {STRINGS.components}
          </Ui.Heading>
          <Ui.Text tone="muted">
            <bdi>{STRINGS.componentsNote}</bdi>
          </Ui.Text>
        </div>
        <PageGallery pages={pages} search={search} headingLevel={3} />
      </section>
    </article>
  );
}
