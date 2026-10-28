/**
 * Stackra file contract:
 * Purpose: `createApp` of the browser target: boots the container from the generated wiring and the build's public
 *          env, and returns the `BrowserApp`: `hydrate()` brings a server-rendered document to life with React
 *          Router's `HydratedRouter` (in a transition, under `StrictMode`, the container and the server's nonce);
 *          `mount(root)` renders a client-rendered route tree with a browser router, or a hash router inside the
 *          desktop shell (`app:` origin). The session is loaded once at boot for `ctx.session` and `ctx.identity`.
 * Boundary: the contexts of the config classes are mounted by the route tree's root (the web `root.tsx`, the router
 *           root `toRoot` writes), which holds the locale and its catalogues, the same on the server and here. Every
 *           render error React catches or misses goes to the reporter once.
 * Runtime: browser
 * Governing contract: ADR 0295 (decisions 7, 8 and 10); ADR 0165 (React Router 7); ADR 0249 (web, PWA and Electron);
 *                     ADR 0457 (session on RouteServices).
 */
import type { Wiring } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { NonceProvider } from "@stackra/csp/react";
import { contributeRouteContext } from "@stackra/navigation";
import { StrictMode, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { createBrowserRouter, createHashRouter } from "react-router";
import { HydratedRouter, RouterProvider } from "react-router/dom";

import { browserEnv } from "#browser/functions/browser-env.function";
import { rootErrorOptions } from "#browser/functions/root-error-options.function";
import type { BrowserApp } from "#browser/types/browser-app.type";
import type { BrowserAppOptions } from "#browser/types/browser-app-options.type";
import { bootApp } from "#core/functions/boot-app.function";
import { loadRouteSession } from "#core/functions/load-route-session.function";
import { routeSessionPart } from "#core/functions/route-session-part.function";
import type { AppSections } from "#core/types/app-sections.type";

/**
 * The browser app of a server-rendered member: `hydrate()`.
 *
 * @example
 * export const app = await createApp(wiring);
 * app.hydrate({ nonce });
 */
export function createApp(wiring: Wiring & AppSections): Promise<BrowserApp>;

/**
 * The browser app of a client-rendered member: `mount(root)` over `routes`.
 *
 * @example
 * export const app = await createApp({ wiring, routes });
 * app.mount(root);
 */
// oxlint-disable-next-line typescript/unified-signatures -- reason: two documented call forms, a wiring or the options object
export function createApp(options: BrowserAppOptions): Promise<BrowserApp>;

/** Boots once and builds the app object for either form. */
export async function createApp(
  input: (Wiring & AppSections) | BrowserAppOptions,
): Promise<BrowserApp> {
  // A wiring always names its member; the options object never does.
  const options: BrowserAppOptions = "member" in input ? { wiring: input } : input;
  const { container, reporter } = await bootApp(options.wiring, { env: browserEnv() });
  // shortcut: loaded once per page load; the web's sign-in and sign-out leave the page, a device flow re-boots.
  await loadRouteSession(container);
  contributeRouteContext(routeSessionPart);
  const routes = options.routes;
  const router =
    routes === undefined
      ? undefined
      : globalThis.location?.protocol === "app:"
        ? createHashRouter(routes)
        : createBrowserRouter(routes);

  return {
    router,
    mount(root) {
      if (router === undefined)
        throw new Error("mount needs the route tree: createApp({ wiring, routes })");
      createRoot(root, rootErrorOptions(reporter)).render(
        <StrictMode>
          <ContainerProvider container={container}>
            <RouterProvider router={router} />
          </ContainerProvider>
        </StrictMode>,
      );
    },
    hydrate({ nonce = "" } = {}) {
      startTransition(() => {
        hydrateRoot(
          document,
          <StrictMode>
            <ContainerProvider container={container}>
              <NonceProvider value={nonce}>
                <HydratedRouter />
              </NonceProvider>
            </ContainerProvider>
          </StrictMode>,
          rootErrorOptions(reporter),
        );
      });
    },
  };
}
