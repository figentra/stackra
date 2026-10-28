/**
 * Stackra file contract:
 * Purpose: `BrowserApp`, what `createApp` from `@stackra/app/browser` resolves to: `mount(root)` for a client-rendered
 *          app, `hydrate()` for a server-rendered document, and the `router` of a client-rendered app.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0295 (decision 8).
 */
import type { createBrowserRouter } from "react-router";

import type { HydrateOptions } from "#browser/types/hydrate-options.type";

/** A browser app. */
export interface BrowserApp {
  /**
   * Renders the route tree into `root`.
   *
   * @throws Error when `createApp` was given no routes.
   */
  mount: (root: Element) => void;

  /** Hydrates the server-rendered document with React Router's `HydratedRouter`, in a transition. */
  hydrate: (options?: HydrateOptions) => void;

  /** The router over the given routes (a hash router inside the desktop shell); undefined without routes. */
  readonly router: ReturnType<typeof createBrowserRouter> | undefined;
}
