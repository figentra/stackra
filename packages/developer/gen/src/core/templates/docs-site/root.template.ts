/**
 * Stackra file contract:
 * Purpose: `ROOT_TEMPLATE`, the `app/root.tsx` of a generated Fumadocs site: the document shell, the favicon, the
 *          Fumadocs provider with the static search dialog, and the error boundary that renders the 404 page.
 * Boundary: a constant; the emitted file reads only `app/site.json` and the site's own modules.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decision 1); STA-2026.
 */

/** The emitted `app/root.tsx`. */
export const ROOT_TEMPLATE = `import "./app.css";

import { RootProvider } from "fumadocs-ui/provider/react-router";
import type { ReactNode } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import SearchDialog from "./components/search";
import NotFound from "./routes/not-found";
import site from "./site.json";

export function links() {
  return site.favicon === null ? [] : [{ rel: "icon", href: site.favicon }];
}

export function Layout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider search={{ SearchDialog }}>{children}</RootProvider>
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
