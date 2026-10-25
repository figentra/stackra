/**
 * Stackra file contract:
 * Purpose: `r2Bucket(args)`, one R2 bucket of the core stack and, when it has an expiry, the lifecycle rule that
 *          deletes every object older than it: the Turborepo remote cache expires after 7 days, matching turbo's local
 *          `cacheMaxAge`.
 * Boundary: declares Pulumi resources only. The cache Worker that serves Turborepo's API from the bucket deploys from
 *           CI with wrangler (ADR 0289 decisions 1 and 2), and its token and signature key live in Infisical `/ci`.
 * Runtime: node (Pulumi program)
 * Governing contract: ADR 0026 (decisions 1 and 2, and the expiry rule of its consequences), ADR 0171 (decisions 6
 *                     and 7).
 */
import * as cloudflare from "@pulumi/cloudflare";

/** Seconds in a day: R2 lifecycle ages are in seconds. */
const DAY = 86_400;

/**
 * The bucket `name` and its lifecycle.
 *
 * @param args - the account id, the bucket name and the days after which objects are deleted (none: kept).
 * @example
 * r2Bucket({ accountId, name: "turbo-cache", expireDays: 7 });
 */
export function r2Bucket(args: {
  readonly accountId: string;
  readonly name: string;
  readonly expireDays?: number | undefined;
}) {
  const { accountId, name, expireDays } = args;
  const bucket = new cloudflare.R2Bucket(`r2-${name}`, { accountId, name });
  const lifecycle =
    expireDays === undefined
      ? undefined
      : new cloudflare.R2BucketLifecycle(`r2-${name}-lifecycle`, {
          accountId,
          bucketName: bucket.name,
          rules: [
            {
              id: `expire-after-${expireDays}-days`,
              enabled: true,
              conditions: { prefix: "" },
              deleteObjectsTransition: { condition: { type: "Age", maxAge: expireDays * DAY } },
            },
          ],
        });
  return { bucket, lifecycle };
}
