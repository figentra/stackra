/**
 * Stackra file contract:
 * Purpose: `RouteTarget`, anything a link, a redirect or a navigation item can point at: a route ref, a generated
 *          settings page (`SettingsPages.messages`, at `/settings/<key-kebab>`), an object holding its `path` or its
 *          `base` path (a panel resource, with the `permission` navigation gates it by), or a path or URL already built.
 * Boundary: a type only; `resolveHref` turns each into a localised href. A string is taken as it is: it is already an
 *           href (a `useLocaleHref` result, an item's `href`), so it is never prefixed again.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20); ADR 0307 (rule 24: settings pages); ADR 0297 (decision 4).
 */
import type { SettingsPage } from "@stackra/settings";

import type { RouteRef } from "#core/types/route-ref.type";

/** A link target. */
export type RouteTarget =
  | RouteRef
  | SettingsPage
  | { readonly path: string }
  | { readonly base: string; readonly permission?: string }
  | string;
