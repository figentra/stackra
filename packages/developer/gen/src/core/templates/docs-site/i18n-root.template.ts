/**
 * Stackra file contract:
 * Purpose: `I18N_ROOT_TEMPLATE`, the `app/root.tsx` of a generated multi-language Fumadocs site: the document shell
 *          with the page's `lang` and `dir`, the locale's web font, and the Fumadocs provider with the direction, the
 *          locale's interface strings and a language switch that keeps the reader on the same page.
 * Boundary: a constant; the emitted file reads only `app/site.json` and the site's own modules. Emitted only when the
 *           DocsConfig sets `locales`; a single-language site keeps `ROOT_TEMPLATE`.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (Fumadocs docs sites); brand family/i18n/ar-voice.md §7 (RTL).
 */

/** The emitted `app/root.tsx` of a multi-language site. */
export const I18N_ROOT_TEMPLATE = `import "./app.css";

import { RootProvider } from "fumadocs-ui/provider/react-router";
import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "react-router";

import SearchDialog from "./components/search";
import { LOCALES, localeOf, switchLocale } from "./lib/locale";
import NotFound from "./routes/not-found";
import site from "./site.json";

const translations = site.translations as Readonly<Record<string, Readonly<Record<string, string>>>>;

export function links() {
  return site.favicon === null ? [] : [{ rel: "icon", href: site.favicon }];
}

export function Layout({ children }: { readonly children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const locale = localeOf(pathname);
  return (
    <html lang={locale.code} dir={locale.dir} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {locale.font === null ? null : <link rel="stylesheet" href={locale.font.href} />}
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider
          dir={locale.dir}
          search={{ SearchDialog }}
          i18n={{
            locale: locale.code,
            locales: LOCALES.map((entry) => ({ name: entry.label, locale: entry.code })),
            translations: translations[locale.code] ?? {},
            onLocaleChange: (code: string) => navigate(switchLocale(pathname, code)),
          }}
        >
          {children}
        </RootProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: { readonly error: unknown }) {
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;
  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 pt-16">
      <h1>Something went wrong</h1>
      <p>{isRouteErrorResponse(error) ? error.statusText : "An unexpected error occurred."}</p>
    </div>
  );
}
`;
