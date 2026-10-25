/**
 * Stackra file contract:
 * Purpose: `parseEdge(root, source?)`, the root runway's `edge` block checked and defaulted: the proxy rule, the
 *          managed WAF, the bot mode, the per-IP rate limit, TLS and the API host label every edge zone applies.
 * Boundary: a parsed root runway in, a policy out. The runway schema leaves `edge` open for its owners, and this is
 *           the Cloudflare owner's check; keys other owners read pass through.
 * Runtime: isomorphic
 * Governing contract: ADR 0175 (decision 1), ADR 0217 (decisions 2 and 3), ADR 0237 (layer 1), ADR 0325 (rule 24).
 */
import type { RootRunway } from "@stackra/runway";

import { EDGE_SCHEMA } from "#core/constants/edge-schema.constant";
import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";
import { issuesOf } from "#core/functions/issues-of.function";
import type { EdgePolicy } from "#core/types/edge-policy.type";

/**
 * The edge policy of `root`.
 *
 * @param root - the parsed root runway (`readRunway("runway.yaml", "root")`).
 * @param source - the file, for the error; defaults to `runway.yaml`.
 * @throws CloudflareConfigInvalidError naming each invalid `edge.*` path.
 * @example
 * const edge = parseEdge(readRunway("runway.yaml", "root"));
 * edge.rateLimit.perIp; // { requests: 600, periodSeconds: 60 }
 */
export function parseEdge(root: RootRunway, source = "runway.yaml"): EdgePolicy {
  const result = EDGE_SCHEMA.safeParse(root.edge ?? {});
  if (!result.success)
    throw new CloudflareConfigInvalidError(source, issuesOf(result.error, "edge"));
  return result.data;
}
