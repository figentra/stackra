/**
 * Stackra file contract:
 * Purpose: `getCacheKey`, the cache key Metro mixes into every transformed file: gen's transformer name and version
 *          with the upstream transformer's key, so changing either one invalidates Metro's cache.
 * Boundary: reads the project root Metro runs in (the process working directory).
 * Runtime: node
 * Governing contract: ADR 0127 2026-10-24 note (`@stackra/gen/metro-transformer`); ADR 0305 (rule 40).
 */
import { upstreamTransformer } from "#metro-transformer/functions/upstream-transformer.function";

/** Bumped whenever the class-component pass changes its output. */
const PASS_VERSION = "1";

/**
 * Metro's cache key for this transformer.
 *
 * @example
 * getCacheKey(); // "stackra-class-components@1:<upstream key>"
 */
export function getCacheKey(): string {
  let upstream = "";
  try {
    upstream = upstreamTransformer(process.cwd()).getCacheKey?.() ?? "";
  } catch {
    upstream = "";
  }
  return `stackra-class-components@${PASS_VERSION}:${upstream}`;
}
