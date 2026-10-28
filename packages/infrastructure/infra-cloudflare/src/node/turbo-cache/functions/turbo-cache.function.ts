/**
 * Stackra file contract:
 * Purpose: `turboCache(args)`, the Cloudflare resources of the Turborepo remote cache in one call: its R2 bucket with
 *          the lifecycle rule that deletes artifacts after `expireDays` (7 in the stack config, matching turbo's
 *          `cacheMaxAge` and the Worker's TTL setting), and, when a host is given, the Workers Custom Domain that puts
 *          the `stackra-turbo-cache` Worker on it.
 * Boundary: declares Pulumi resources only, through `r2Bucket`. The Worker script, its R2 binding, settings and token
 *           secret are wrangler's (workers/turbo-cache, deployed from CI); the token is never an input or output here.
 *           No ADR names the host, so it is a stack setting. A stack uses this or the core stack's `buckets` entry and
 *           zone `workers` entry for the same bucket and host, never both.
 * Runtime: node
 * Governing contract: ADR 0026 (decision 1 and the expiry rule); ADR 0171 (decision 6); ADR 0289 (decision 2).
 */
import * as cloudflare from "@pulumi/cloudflare";
import type * as pulumi from "@pulumi/pulumi";

import { r2Bucket } from "#node/functions/r2-bucket.function";

/**
 * The turbo cache's bucket, lifecycle and optional custom domain.
 *
 * @param args - the account id, the bucket name and expiry in days, the Worker script name, and the host with its
 *               zone id (none: no domain is declared).
 * @example
 * turboCache({
 *   accountId,
 *   bucket: "turbo-cache",
 *   expireDays: 7,
 *   script: "stackra-turbo-cache",
 *   domain: { hostname: "turbo.stackra.figentra.com", zoneId: zone.id },
 * });
 */
export function turboCache(args: {
  readonly accountId: string;
  readonly bucket: string;
  readonly expireDays: number;
  readonly script: string;
  readonly domain?:
    | { readonly hostname: string; readonly zoneId: pulumi.Input<string> }
    | undefined;
}): {
  bucket: cloudflare.R2Bucket;
  lifecycle: cloudflare.R2BucketLifecycle | undefined;
  customDomain: cloudflare.WorkersCustomDomain | undefined;
} {
  const { accountId, bucket: name, expireDays, script, domain } = args;
  if (!Number.isInteger(expireDays) || expireDays < 1)
    throw new RangeError(
      `expireDays must be a whole number of days, at least 1 (got ${expireDays})`,
    );
  const { bucket, lifecycle } = r2Bucket({ accountId, name, expireDays });
  const customDomain =
    domain === undefined
      ? undefined
      : new cloudflare.WorkersCustomDomain(`turbo-cache-${domain.hostname}`, {
          accountId,
          hostname: domain.hostname,
          service: script,
          zoneId: domain.zoneId,
        });
  return { bucket, lifecycle, customDomain };
}
