/**
 * Stackra file contract:
 * Purpose: `SiteHeaderBlockProps`, what a page hands the SiteHeaderBlock: the brand, the section links, the docs
 *          search, the ask-AI link, the code host link and the locale and theme switchers.
 * Boundary: an interface in its own file beside the component (ADR 0305). Every word is page content; the brand and
 *           the two switchers are the app's own elements.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041 (the landing).
 */
import type { ReactNode } from "react";

/**
 * The marketing site's top bar.
 *
 * @example
 * <SiteHeaderBlock brand={<Wordmark />} links={links} docsSearch={{ label: "Search docs", href: "/docs" }}
 *   githubHref="https://github.com/figentra/stackra" />
 */
export interface SiteHeaderBlockProps {
  /** The wordmark or logo, a link home; the app's own element. */
  readonly brand: ReactNode;
  /** The site's sections, in order. */
  readonly links: readonly { readonly label: string; readonly href: string }[];
  /** The spoken name of the section links' `nav`; name it when the page has another `nav` (the section dock). */
  readonly navLabel?: string | undefined;
  /** A link drawn as a search field that opens the docs search. */
  readonly docsSearch: { readonly label: string; readonly href: string };
  /** A link to ask the docs a question. */
  readonly askAi?: { readonly label: string; readonly href: string } | undefined;
  /** The repository's URL. */
  readonly githubHref: string;
  /** The repository link's words. Defaults to "GitHub", a name. */
  readonly githubLabel?: string | undefined;
  /** The locale switcher, the app's own element. */
  readonly localeSwitcher?: ReactNode;
  /** The light and dark switch, the app's own element. */
  readonly themeToggle?: ReactNode;
  /** Styles the header. */
  readonly className?: string | undefined;
}
