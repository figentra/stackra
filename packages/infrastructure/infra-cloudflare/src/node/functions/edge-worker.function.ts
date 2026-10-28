/**
 * Stackra file contract:
 * Purpose: `edgeWorker(args)`, the Cloudflare resources around the OS edge Worker: its KV namespaces (the `host:`,
 *          `boot:`, `shell:`, `release:`, `canary:` and `wellknown:` copy), its routes on each zone, its gradual
 *          deployment over one or two uploaded versions, and the origin lock of each regional API (a Cloudflare Tunnel
 *          or authenticated origin pulls, behind an Access application that admits only the Worker's service token);
 *          plus the secret slots of the two active signing keys.
 * Boundary: declares Pulumi resources only. The Worker's code, its bindings and its version uploads are wrangler's,
 *           from CI (ADR 0284 decision 6); this program moves traffic between uploaded versions as the stack config
 *           says, and the deploy job's health gate writes those shares (the steps and threshold are OS settings). No
 *           secret is an input or an output: the tunnel token, the service token's secret and the signing-key values
 *           stay in the encrypted state or are placed by the owner.
 * Runtime: node
 * Governing contract: ADR 0437 (decisions 1, 4, 5, 6 and 9), ADR 0284 (decision 6), ADR 0171 (decision 6), ADR 0290
 *                     (decision 5: tunnels with remote ingress).
 */
import * as cloudflare from "@pulumi/cloudflare";
import type * as pulumi from "@pulumi/pulumi";

import { OriginLock } from "#core/enums/origin-lock.enum";
import { signingKeySlots } from "#core/functions/signing-key-slots.function";
import { zoneOf } from "#core/functions/zone-of.function";
import type { EdgeWorker } from "#core/types/edge-worker.type";
import type { SigningKeySlot } from "#core/types/signing-key-slot.type";
import { devTunnel } from "#node/functions/dev-tunnel.function";

/**
 * The edge Worker's resources.
 *
 * @param args - the account id, the project (a name prefix), the id of each runway zone by name and the stack's
 *               `edgeWorker` config. `cloudflareCoreStack` has already checked that every route zone and origin host
 *               is a runway zone's.
 * @example
 * edgeWorker({ accountId, project: "figentra", zoneIds: { "figentra.com": zone.id }, worker: stack.edgeWorker });
 */
export function edgeWorker(args: {
  readonly accountId: string;
  readonly project: string;
  readonly zoneIds: Readonly<Record<string, pulumi.Input<string>>>;
  readonly worker: EdgeWorker;
}): {
  namespaces: Record<string, cloudflare.WorkersKvNamespace>;
  routes: cloudflare.WorkersRoute[];
  deployment: cloudflare.WorkersDeployment | undefined;
  originToken: cloudflare.ZeroTrustAccessServiceToken | undefined;
  originPolicy: cloudflare.ZeroTrustAccessPolicy | undefined;
  origins: Record<
    string,
    {
      application: cloudflare.ZeroTrustAccessApplication;
      tunnel: ReturnType<typeof devTunnel> | undefined;
    }
  >;
  originPulls: cloudflare.AuthenticatedOriginPullsSettings[];
  signingKeys: SigningKeySlot[];
} {
  const { accountId, project, zoneIds, worker } = args;
  const { script } = worker;
  const zoneId = (hostname: string) => zoneIds[zoneOf(hostname, Object.keys(zoneIds)) ?? ""] ?? "";

  const namespaces = Object.fromEntries(
    Object.entries(worker.namespaces).map(([label, options]) => [
      label,
      new cloudflare.WorkersKvNamespace(`${script}-kv-${label}`, {
        accountId,
        title: `${script}-${label}`,
        jurisdiction: options.jurisdiction,
      }),
    ]),
  );
  const routes = Object.entries(worker.routes).flatMap(([zone, patterns]) =>
    patterns.map(
      (pattern, index) =>
        new cloudflare.WorkersRoute(`${script}-${zone}-route-${index}`, {
          zoneId: zoneIds[zone] ?? "",
          pattern,
          script,
        }),
    ),
  );
  const deployment =
    worker.rollout === undefined
      ? undefined
      : new cloudflare.WorkersDeployment(`${script}-deployment`, {
          accountId,
          scriptName: script,
          strategy: "percentage",
          versions: worker.rollout.map((entry) => ({
            versionId: entry.version,
            percentage: entry.percent,
          })),
        });

  const regions = Object.entries(worker.origins);
  const originToken =
    regions.length === 0
      ? undefined
      : new cloudflare.ZeroTrustAccessServiceToken(`${script}-origin-token`, {
          accountId,
          name: `${project}-${script}`,
        });
  const originPolicy =
    originToken === undefined
      ? undefined
      : new cloudflare.ZeroTrustAccessPolicy(`${script}-origin-policy`, {
          accountId,
          name: `${project} ${script} origin`,
          decision: "non_identity",
          includes: [{ serviceToken: { tokenId: originToken.id } }],
        });
  const origins = Object.fromEntries(
    regions.map(([region, origin]) => [
      region,
      {
        application: new cloudflare.ZeroTrustAccessApplication(`${script}-origin-${region}`, {
          accountId,
          name: `${project} ${script} origin ${region}`,
          type: "self_hosted",
          domain: origin.hostname,
          destinations: [{ type: "public", uri: origin.hostname }],
          policies: originPolicy === undefined ? [] : [{ id: originPolicy.id, precedence: 1 }],
        }),
        tunnel:
          origin.lock === OriginLock.Tunnel && origin.service !== undefined
            ? devTunnel({
                accountId,
                zoneId: zoneId(origin.hostname),
                name: `${project}-origin-${region}`,
                ingress: [
                  { hostname: origin.hostname, service: origin.service },
                  { service: "http_status:404" },
                ],
                comment: `Edge origin ${region}: reachable only through the Worker (ADR 0437 decision 5)`,
              })
            : undefined,
      },
    ]),
  );
  const mtlsZones = new Set(
    regions.flatMap(([, origin]) =>
      origin.lock === OriginLock.Mtls ? [zoneOf(origin.hostname, Object.keys(zoneIds)) ?? ""] : [],
    ),
  );
  const originPulls = [...mtlsZones].map(
    (zone) =>
      new cloudflare.AuthenticatedOriginPullsSettings(`${zone}-origin-pulls`, {
        zoneId: zoneIds[zone] ?? "",
        enabled: true,
      }),
  );

  return {
    namespaces,
    routes,
    deployment,
    originToken,
    originPolicy,
    origins,
    originPulls,
    signingKeys: signingKeySlots(worker.signingKeys),
  };
}
