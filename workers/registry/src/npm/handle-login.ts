/**
 * Stackra file contract:
 * Purpose: `handleLogin`: `PUT /-/user/*`: there is no login; licence tokens go in `.npmrc`.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { failure } from "#src/http/failure";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";

/** `PUT /-/user/*`: there is no login; licence tokens go in `.npmrc`. */
export const handleLogin = (deps: RegistryDeps): Response =>
  failure(
    403,
    `The Stackra registry has no login. Put your licence token in .npmrc: ${deps.settings.licenceDocsUrl}`,
  );
