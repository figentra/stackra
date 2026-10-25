/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./browser` runtime-target entry of @stackra/app (the browser `createApp`, the
 *          one-page `hydrateRoute` and their types), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./react` through `#core/*` and `#react/*`.
 * Runtime: browser
 * Governing contract: ADR 0295 (decision 8); ADR 0127 2026-10-24 note (runtime-target entries).
 */
export { createApp } from "#browser/functions/create-app.function";
export { hydrateRoute } from "#browser/functions/hydrate-route.function";
export type { BrowserApp } from "#browser/types/browser-app.type";
export type { BrowserAppOptions } from "#browser/types/browser-app-options.type";
export type { HydrateOptions } from "#browser/types/hydrate-options.type";
export type { HydrateRouteOptions } from "#browser/types/hydrate-route-options.type";
export type { HydrateRoutePart } from "#browser/types/hydrate-route-part.type";
