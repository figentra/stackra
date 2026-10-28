/**
 * Stackra file contract:
 * Purpose: `loginDirectoryWorker(args)`, the Cloudflare resources around the login directory Worker: its own KV
 *          namespace (global, never jurisdiction-bound, so sign-in survives the loss of any region) and its routes,
 *          such as `login.<product-domain>/directory` on each product zone.
 * Boundary: declares Pulumi resources only. A separate Worker from the OS edge Worker (ADR 0437), with its own script
 *           and namespace. Its code (`loginDirectoryHandler` wired by the host), its bindings, the hash key secret and
 *           the regions' KV-scoped API tokens are wrangler's and the owner's, never inputs or outputs here.
 * Runtime: node
 * Governing contract: ADR 0451; ADR 0353 (decision 4); OS ADR 0002 (decision 1); ADR 0437; ADR 0171 (decision 6).
 */
import * as cloudflare from "@pulumi/cloudflare";
import type * as pulumi from "@pulumi/pulumi";

/**
 * The login directory Worker's resources.
 *
 * @param args - the account id, the Worker script name, the id of each zone by name and the route patterns per zone.
 * @example
 * loginDirectoryWorker({
 *   accountId,
 *   script: "figentra-login-directory",
 *   zoneIds: { "mezzora.com": zone.id },
 *   routes: { "mezzora.com": ["login.mezzora.com/directory"] },
 * });
 */
export function loginDirectoryWorker(args: {
  readonly accountId: string;
  readonly script: string;
  readonly zoneIds: Readonly<Record<string, pulumi.Input<string>>>;
  readonly routes: Readonly<Record<string, readonly string[]>>;
}): { namespace: cloudflare.WorkersKvNamespace; routes: cloudflare.WorkersRoute[] } {
  const { accountId, script, zoneIds } = args;
  const namespace = new cloudflare.WorkersKvNamespace(`${script}-kv`, {
    accountId,
    title: `${script}-directory`,
  });
  const routes = Object.entries(args.routes).flatMap(([zone, patterns]) => {
    const zoneId = zoneIds[zone];
    if (zoneId === undefined) throw new RangeError(`No zone id for ${zone}`);
    return patterns.map(
      (pattern, index) =>
        new cloudflare.WorkersRoute(`${script}-${zone}-route-${index}`, {
          zoneId,
          pattern,
          script,
        }),
    );
  });
  return { namespace, routes };
}
