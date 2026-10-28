/**
 * Stackra file contract:
 * Purpose: `valkeyCache(cache, placement, opts)`, a deployment's shared Memorystore for
 *          Valkey instance: its node type, shards and replicas from the runway (cluster mode on past one shard, nodes
 *          across zones once there is a replica), the eviction policy, in-transit encryption always, IAM sign-in unless
 *          the runway says `none`, deletion protection, and its Private Service Connect endpoints on the deployment's
 *          VPC, with the `gcp-memorystore` connection policy on the runway's subnet when it names one.
 * Boundary: internal building block of `gcpRuntime`; declares Pulumi resources only. No persistence: it is a cache, so
 *           a restart may empty it. A VPC has one `gcp-memorystore` policy per region: name `subnet` in one runtime
 *           stack per VPC and region only.
 * Runtime: node
 * Governing contract: ADR 0296 (decisions 1 and 5: the shared Valkey cache), ADR 0354, ADR 0186 (in the
 *                     deployment's region).
 */
import * as gcp from "@pulumi/gcp";
import type * as pulumi from "@pulumi/pulumi";

import type { GcpRuntimeConfig } from "#core/types/gcp-runtime-config.type";
import { resolveRef } from "#node/functions/resolve-ref.function";

/** Where the cache lives and how its resources are parented. */
type Placement = {
  /** The deployment prefix every resource name starts with. */
  readonly prefix: string;
  /** The GCP project id. */
  readonly project: string;
  /** The deployment's region. */
  readonly region: string;
  /** The deployment's labels. */
  readonly labels: Readonly<Record<string, string>>;
};

/**
 * The instance, and the `host:port` clients discover the instance through.
 *
 * @example
 * const cache = valkeyCache(config.cache, { prefix, project, region, labels }, scoped);
 */
export function valkeyCache(
  cache: NonNullable<GcpRuntimeConfig["cache"]>,
  placement: Placement,
  opts: pulumi.CustomResourceOptions,
): { instance: gcp.memorystore.Instance; endpoint: pulumi.Output<string> } {
  const { prefix, project, region, labels } = placement;
  const network = resolveRef(cache.network);
  const policy =
    cache.subnet === null
      ? []
      : [
          new gcp.networkconnectivity.ServiceConnectionPolicy(
            `${prefix}-cache-psc`,
            {
              project,
              location: region,
              name: `${prefix}-cache-psc`,
              serviceClass: "gcp-memorystore",
              network,
              pscConfig: { subnetworks: [resolveRef(cache.subnet)] },
            },
            opts,
          ),
        ];
  const instance = new gcp.memorystore.Instance(
    `${prefix}-cache`,
    {
      project,
      location: region,
      instanceId: `${prefix}-cache`,
      nodeType: cache.node,
      shardCount: cache.shards,
      replicaCount: cache.replicas,
      mode: cache.shards > 1 ? "CLUSTER" : "CLUSTER_DISABLED",
      zoneDistributionConfig: { mode: cache.replicas > 0 ? "MULTI_ZONE" : "SINGLE_ZONE" },
      transitEncryptionMode: "SERVER_AUTHENTICATION",
      authorizationMode: cache.auth === "iam" ? "IAM_AUTH" : "AUTH_DISABLED",
      deletionProtectionEnabled: true,
      labels: { ...labels },
      ...(cache.eviction !== null && { engineConfigs: { "maxmemory-policy": cache.eviction } }),
      desiredAutoCreatedEndpoints: [{ network, projectId: project }],
    },
    { ...opts, dependsOn: policy },
  );
  const endpoint = instance.endpoints.apply((endpoints) => {
    // Unset until the instance exists (a preview, the mocks), whatever the provider's type says.
    const discovery = ((endpoints as typeof endpoints | undefined) ?? [])
      .flatMap((entry) => entry.connections ?? [])
      .map((connection) => connection.pscAutoConnection)
      .find((connection) => connection?.connectionType === "CONNECTION_TYPE_DISCOVERY");
    return discovery === undefined ? "" : `${discovery.ipAddress}:${discovery.port}`;
  });
  return { instance, endpoint };
}
