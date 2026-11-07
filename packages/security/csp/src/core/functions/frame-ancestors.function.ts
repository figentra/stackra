/**
 * Stackra file contract:
 * Purpose: `frameAncestors`, the `frame-ancestors` sources of one response: the configured entry of the request's
 *          path (an exact key first, then the longest `/*` prefix), either its static framers or, for a `"request"`
 *          entry, the framers the runtime resolved for this request; `'none'` when nothing matches or nothing resolved.
 * Boundary: every framer passes `frameAncestorOrigin`, so neither configuration nor a resolver can allow a wildcard.
 *           Resolved framers on a path whose entry is not `"request"` throw: a resolver never widens a static path.
 *           Pure. Internal: `contentSecurityPolicy` and `securityHeaders` call it.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0334 rule 12.
 */
import type { CspConfig } from "#config/csp.config";
import { frameAncestorOrigin } from "#core/functions/frame-ancestor-origin.function";
import { frameAncestorsEntry } from "#core/functions/frame-ancestors-entry.function";
import type { CspAdditions } from "#core/types/csp-additions.type";

/**
 * The `frame-ancestors` sources of one response.
 *
 * @throws TypeError when a framer is not `self` or one origin, or framers were resolved for a path that takes none.
 * @example
 * frameAncestors(csp, { path: "/c/cs_01", frameAncestors: merchantOrigins }); // ["https://shop.example"]
 */
export function frameAncestors(
  config: Pick<CspConfig, "frameAncestors">,
  additions: Pick<CspAdditions, "path" | "frameAncestors"> = {},
): readonly string[] {
  const { path, frameAncestors: resolved } = additions;
  const entry = path === undefined ? undefined : frameAncestorsEntry(config, path);
  if (resolved !== undefined && entry !== "request") {
    throw new TypeError(`the path "${path ?? ""}" takes no per-request frame ancestors`);
  }
  const sources = entry === "request" ? (resolved ?? []) : (entry ?? []);
  const origins = [...new Set(sources.map(frameAncestorOrigin))];
  return origins.length === 0 ? ["'none'"] : origins;
}
