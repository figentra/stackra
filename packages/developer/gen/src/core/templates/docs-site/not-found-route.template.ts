/**
 * Stackra file contract:
 * Purpose: `NOT_FOUND_ROUTE_TEMPLATE`, the `app/routes/not-found.tsx` of a generated Fumadocs site: the 404 page,
 *          prerendered at `/404` and moved to `404.html` for the Worker, and rendered by the root error boundary.
 * Boundary: a constant.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decision 1); STA-2026 (an unknown path answers the site's 404 page).
 */

/** The emitted `app/routes/not-found.tsx`. */
export const NOT_FOUND_ROUTE_TEMPLATE = `import { HomeLayout } from "fumadocs-ui/layouts/home";
import { Link } from "react-router";

import { baseOptions } from "../lib/layout";
import site from "../site.json";

export default function NotFound() {
  return (
    <HomeLayout {...baseOptions()}>
      <title>{"Page not found · " + site.name}</title>
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-2 text-xl font-bold">Page not found</h1>
        <p className="mb-4 text-fd-muted-foreground">This page moved or never existed. Try search.</p>
        <Link
          className="rounded-full bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground"
          to="/"
        >
          Back to the docs
        </Link>
      </div>
    </HomeLayout>
  );
}
`;
