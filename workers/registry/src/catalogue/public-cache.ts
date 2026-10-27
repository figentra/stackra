/**
 * Stackra file contract:
 * Purpose: `publicCache`: the public Cache-Control of catalogue answers.
 * Boundary: metadata only, to anyone, for the `open` and `licensed` scopes; never a tarball or file contents beyond
 *           the `stackra` field. `internal` scopes are not listed.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 11, 12 and 13).
 */
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";

/** The public Cache-Control of catalogue answers. */
export const publicCache = (deps: RegistryDeps): Record<string, string> => ({
  "cache-control": `public, max-age=${deps.settings.openPackumentMaxAge}`,
});
