/**
 * Stackra file contract:
 * Purpose: `handleKeys`: `GET /-/npm/v1/keys`: the current and rotated signing keys.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { json } from "#src/http/json";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";

/** `GET /-/npm/v1/keys`: the current and rotated signing keys. */
export const handleKeys = (deps: RegistryDeps): Response =>
  json({ keys: deps.signer.keys() }, 200, {
    "cache-control": `public, max-age=${deps.settings.openPackumentMaxAge}`,
  });
