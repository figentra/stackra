/**
 * Stackra file contract:
 * Purpose: `hydrateRoute`, the hydration of one prerendered page (the offline page the service worker serves): it
 *          boots the container from the wiring, loads the catalogues of the locale the page was prerendered for, and
 *          hydrates the route inside its layout under the named contexts, with a one-route memory router so the
 *          layout's outlet works without the app's route tree, session or clients.
 * Boundary: the route and layout instances are resolved from the container and kept as their match's `handle`; the
 *           components render with no props of their own. A locale the i18n configuration does not list, or a wiring
 *           without a `messages` loader, throws before anything renders. Render errors go to the reporter once.
 * Runtime: browser
 * Governing contract: ADR 0295 (decision 10); ADR 0297 (prerender); ADR 0305 (rules 37 to 41).
 */
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig } from "@stackra/i18n";
import { createElement, StrictMode } from "react";
import type { ComponentType } from "react";
import { hydrateRoot } from "react-dom/client";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import { browserEnv } from "#browser/functions/browser-env.function";
import { rootErrorOptions } from "#browser/functions/root-error-options.function";
import type { HydrateRouteOptions } from "#browser/types/hydrate-route-options.type";
import { bootApp } from "#core/functions/boot-app.function";
import { messagesOf } from "#core/functions/messages-of.function";
import { Contexts } from "#react/contexts/contexts";

/**
 * Hydrates `root` with one route inside its layout.
 *
 * @throws Error (as a rejection) for a locale the i18n configuration does not list or a wiring without `messages`.
 * @example
 * await hydrateRoute(root, {
 *   wiring,
 *   layout: { class: PublicLayout, component: Public },
 *   route: { class: OfflineRoute, component: Offline },
 *   locale: document.documentElement.lang,
 *   contexts: ["platform", "query", "theming", "i18n", "ui"],
 * });
 */
export async function hydrateRoute(root: Element, options: HydrateRouteOptions): Promise<void> {
  const { container, reporter, wiring } = await bootApp(options.wiring, { env: browserEnv() });
  const wanted = options.locale.toLowerCase();
  const locale = container.get(I18nConfig).locales.find((known) => known.toLowerCase() === wanted);
  if (locale === undefined)
    throw new Error(`The page's locale "${options.locale}" is not one of the configured locales`);
  const messages = await messagesOf(wiring, locale);
  const router = createMemoryRouter(
    [
      {
        element: createElement(options.layout.component as ComponentType),
        handle: container.get(options.layout.class),
        children: [
          {
            path: "*",
            element: createElement(options.route.component as ComponentType),
            handle: container.get(options.route.class),
          },
        ],
      },
    ],
    { initialEntries: [globalThis.location?.pathname ?? "/"] },
  );
  const contexts = options.contexts === undefined ? {} : { contexts: options.contexts };
  hydrateRoot(
    root,
    <StrictMode>
      <ContainerProvider container={container}>
        <Contexts locale={locale} messages={messages} {...contexts}>
          <RouterProvider router={router} />
        </Contexts>
      </ContainerProvider>
    </StrictMode>,
    rootErrorOptions(reporter),
  );
}
