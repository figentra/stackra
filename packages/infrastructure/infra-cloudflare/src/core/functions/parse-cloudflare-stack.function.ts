/**
 * Stackra file contract:
 * Purpose: `parseCloudflareStack(document, source?)`, the core stack's Cloudflare config checked and defaulted: the
 *          dev zone, zone options, R2 buckets, dev tunnels and the Access gate.
 * Boundary: a parsed value in (the stacks repository passes the `infra-cloudflare` key of its stack config, apart from
 *           the `cloudflare` key its `ref:` values read), a typed config out. Whether each zone is one the root runway
 *           names is `cloudflareCoreStack`'s check, which has the runway.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 6), ADR 0290 (decisions 1 to 6, 11 and 15), ADR 0026.
 */
import { CLOUDFLARE_STACK_SCHEMA } from "#core/constants/cloudflare-stack-schema.constant";
import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";
import { issuesOf } from "#core/functions/issues-of.function";
import type { CloudflareStack } from "#core/types/cloudflare-stack.type";

/**
 * The core stack's Cloudflare config.
 *
 * @param document - the parsed config value.
 * @param source - where it came from, for the error; defaults to `cloudflare stack config`.
 * @throws CloudflareConfigInvalidError naming each invalid path: an unknown key, a host outside its zone, tunnels or
 *         Access without the dev zone, a record name that is not relative to its zone.
 * @example
 * const stack = parseCloudflareStack(
 *   new pulumi.Config().requireObject("infra-cloudflare"),
 *   "Pulumi.core.yaml",
 * );
 * stack.buckets["turbo-cache"]?.expireDays; // 7
 */
export function parseCloudflareStack(
  document: unknown,
  source = "cloudflare stack config",
): CloudflareStack {
  const result = CLOUDFLARE_STACK_SCHEMA.safeParse(document);
  if (!result.success) throw new CloudflareConfigInvalidError(source, issuesOf(result.error));
  return result.data;
}
