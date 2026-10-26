/**
 * Stackra file contract:
 * Purpose: `parseStorefront(document, source?)`, a storefront's edge settings checked and defaulted: the shopper key
 *          and each campaign's waiting room and per-shopper limits.
 * Boundary: a parsed value in, a policy out. The document is the tenant's campaign settings as the storefront exports
 *           them for the edge stack; this is the edge owner's check of them.
 * Runtime: isomorphic
 * Governing contract: ADR 0402, ADR 0217 (decision 2).
 */
import { STOREFRONT_SCHEMA } from "#core/constants/storefront-schema.constant";
import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";
import { issuesOf } from "#core/functions/issues-of.function";
import type { StorefrontPolicy } from "#core/types/storefront-policy.type";

/**
 * The storefront policy of `document`.
 *
 * @param source - where the document came from, for the error; defaults to `storefront settings`.
 * @throws CloudflareConfigInvalidError naming each invalid path: a waiting room under Cloudflare's floors or ending
 *         before it starts, a period the edge does not accept, a path with a quote or wildcard, an unknown key.
 * @example
 * const storefront = parseStorefront(campaignSettings);
 * storefront.campaigns["spring-drop"]?.waitingRoom?.enabled; // true
 */
export function parseStorefront(
  document: unknown,
  source = "storefront settings",
): StorefrontPolicy {
  const result = STOREFRONT_SCHEMA.safeParse(document);
  if (!result.success)
    throw new CloudflareConfigInvalidError(source, issuesOf(result.error, "storefront"));
  return result.data;
}
