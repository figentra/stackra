/**
 * Stackra file contract:
 * Purpose: `dockerHubCache(name, opts)`, ECR's pull-through cache for Docker Hub in the account: the rule that serves
 *          `<account>.dkr.ecr.<region>.amazonaws.com/docker-hub/<image>` from `registry-1.docker.io`, and the Secrets
 *          Manager secret it authenticates with (Docker Hub needs a login for a pull-through cache). Runway workloads
 *          pull third-party images (Gotenberg, Chatwoot) through it, digest-pinned, never from Docker Hub directly.
 * Boundary: internal; one per account and region, created by the account's first environment. The secret is created
 *           empty: the owner sets its value (`{"username": …, "accessToken": …}`, a Docker Hub read-only token); no
 *           agent writes or reads it. ECR requires the `ecr-pullthroughcache/` name prefix.
 * Runtime: node
 * Governing contract: ADR 0493 (runway workloads), ADR 0172 (decision 1: the account's foundation), ADR 0173 (no
 *                     secret values in code).
 */
import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";

/** The repository prefix the cache serves Docker Hub images under. */
const PREFIX = "docker-hub";

/** Docker Hub's registry, as ECR names the upstream. */
const UPSTREAM = "registry-1.docker.io";

/** The cache rule and its credential secret. */
export function dockerHubCache(
  name: string,
  opts: pulumi.CustomResourceOptions,
): { rule: aws.ecr.PullThroughCacheRule; secret: aws.secretsmanager.Secret } {
  const secret = new aws.secretsmanager.Secret(
    `${name}-docker-hub-cache`,
    {
      name: `ecr-pullthroughcache/${PREFIX}`,
      description:
        "Docker Hub login for ECR's pull-through cache; the owner sets the value, read-only token",
    },
    opts,
  );
  const rule = new aws.ecr.PullThroughCacheRule(
    `${name}-docker-hub-cache`,
    { ecrRepositoryPrefix: PREFIX, upstreamRegistryUrl: UPSTREAM, credentialArn: secret.arn },
    opts,
  );
  return { rule, secret };
}
