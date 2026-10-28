/**
 * Stackra file contract:
 * Purpose: `registryWorker(args)`, the Cloudflare resources of the Stackra registry Worker (`stackra-registry`,
 *          workers/registry): the private R2 bucket of tarballs and provenance bundles, the D1 database (the source of
 *          truth, protected), the KV namespace of rendered packuments and the GitHub OIDC key set, and the Worker
 *          Custom Domain `npm.stackra.figentra.com` on its zone.
 * Boundary: declares Pulumi resources only. The Worker's code, its bindings (wrangler.jsonc), its D1 migrations and
 *           the REGISTRY_SIGNING_KEY secret are wrangler's and CI's; no secret is an input or an output. Do not also
 *           list the hostname under `cloudflareZone`'s `workers`, which would declare the custom domain twice.
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 1 to 3); ADR 0284 (decision 9); ADR 0171 (decision 6).
 */
import * as cloudflare from "@pulumi/cloudflare";
import type * as pulumi from "@pulumi/pulumi";

/**
 * The registry Worker's resources.
 *
 * @param args - the account, the zone of the host, the host, the Worker script name, the bucket, database and
 *        namespace names, and the id of an existing custom domain to adopt (the npflared Worker holds the name until
 *        ADR 0453 decision 17 moves it).
 * @example
 * registryWorker({
 *   accountId,
 *   zoneId: zone.id,
 *   hostname: "npm.stackra.figentra.com",
 *   script: "stackra-registry",
 *   bucket: "stackra-registry",
 *   database: "stackra-registry",
 *   namespace: "stackra-registry-cache",
 * });
 */
export function registryWorker(args: {
  readonly accountId: string;
  readonly zoneId: pulumi.Input<string>;
  readonly hostname: string;
  readonly script: string;
  readonly bucket: string;
  readonly database: string;
  readonly namespace: string;
  readonly importDomain?: string | undefined;
}): {
  bucket: cloudflare.R2Bucket;
  database: cloudflare.D1Database;
  namespace: cloudflare.WorkersKvNamespace;
  domain: cloudflare.WorkersCustomDomain;
} {
  const { accountId, zoneId, hostname, script } = args;
  // Bytes and truth: never replaced or deleted by a stack change (tarballs are immutable, D1 is the only record).
  const bucket = new cloudflare.R2Bucket(
    `r2-${args.bucket}`,
    { accountId, name: args.bucket },
    { protect: true },
  );
  const database = new cloudflare.D1Database(
    `d1-${args.database}`,
    { accountId, name: args.database },
    { protect: true },
  );
  // A cache: losing every key is harmless (ADR 0453 decision 3).
  const namespace = new cloudflare.WorkersKvNamespace(`kv-${args.namespace}`, {
    accountId,
    title: args.namespace,
  });
  const domain = new cloudflare.WorkersCustomDomain(
    `${hostname}-worker`,
    { accountId, hostname, service: script, zoneId },
    args.importDomain === undefined ? {} : { import: `${accountId}/${args.importDomain}` },
  );
  return { bucket, database, namespace, domain };
}
