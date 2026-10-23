/**
 * Stackra file contract:
 * Purpose: the page of the index route: what the playground is and a link to every page.
 * Boundary: presentation only; the page list comes from the route tree in `main.tsx`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14, rule R7).
 */
import { Link } from "@heroui/react";
import { useLocation } from "react-router";

import { HomeRoute } from "#src/routes/home/home.route";
import type { PageLink } from "#src/types/page-link.type";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::home.*` keys.
const STRINGS = {
  intro:
    "Every Stackra Design System component on its own page, in light and dark and in left-to-right and right-to-left. Switch both from the header; the choice stays in the address, so a link opens the same view.",
  pages: "Pages",
} as const;

/** Props of {@link Home}. */
export interface HomeProps {
  /** The pages to list, in order. */
  pages: readonly PageLink[];
}

/** The index page: a short introduction and the page list. */
export function Home({ pages }: HomeProps) {
  const { search } = useLocation();
  return (
    <article className="grid max-w-prose gap-6">
      <h1 className="text-3xl font-semibold">{HomeRoute.title}</h1>
      <p>{STRINGS.intro}</p>
      <section aria-labelledby="home-pages" className="grid gap-3">
        <h2 id="home-pages" className="text-xl font-semibold">
          {STRINGS.pages}
        </h2>
        <ul className="grid gap-2">
          {pages.map((page) => (
            <li key={page.path}>
              <Link href={`${page.path}${search}`}>{page.title}</Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
