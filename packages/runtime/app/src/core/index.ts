/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/app (the boot every runtime target shares, and the edge
 *          signature function and the Web Crypto bearer-token verifier with its key source, which the Worker and the
 *          API share), until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `createApp` is not here: each runtime target exports its own
 *           from its subpath (ADR 0295 decision 8). `Module`, `Service` and the `define*` functions are not here
 *           either (ADR 0127 2026-10-24 note). The console reporter and the internal helpers (the route session
 *           loader and part) stay internal; `RouteSession` is exported so its `RouteServices` augmentation ships.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note;
 *                     ADR 0457; ADR 0437 (decision 4: `signEdgeRequest`, shared with the edge Worker);
 *                     ADR 0206 (decision 8: `verifyBearerToken`, `jwksKeySource`).
 */
export { bootApp } from "#core/functions/boot-app.function";
export { jwksKeySource } from "#core/functions/jwks-key-source.function";
export { signEdgeRequest } from "#core/functions/sign-edge-request.function";
export { verifyBearerToken } from "#core/functions/verify-bearer-token.function";
export { AppWiring } from "#core/values/app-wiring.value";
export type { AppMessages } from "#core/types/app-messages.type";
export type { AppSections } from "#core/types/app-sections.type";
export type { BootedApp } from "#core/types/booted-app.type";
export type { BootOptions } from "#core/types/boot-options.type";
export type { RouteSession } from "#core/types/route-session.type";
