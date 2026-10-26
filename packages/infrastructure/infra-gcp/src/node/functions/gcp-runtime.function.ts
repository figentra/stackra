/**
 * Stackra file contract:
 * Purpose: `gcpRuntime(config, options?, opts?)`, the Pulumi program of one deployment's GCP runtime: a provider pinned
 *          to its project and region, and its Cloud SQL Postgres server with daily backups kept in the deployment's
 *          region, point-in-time recovery when the runway asks, a standby when highly available, a private IP on the
 *          runway's VPC (else reachable only through the Cloud SQL connector over TLS), deletion protection, and the
 *          deployment's data key when one is passed.
 * Boundary: creates resources only through Pulumi; agents preview or run it under mocks, never `pulumi up`. The
 *           backup location is the instance's own region, so a backup never leaves the jurisdiction (ADR 0186). The
 *           data key comes from the foundation stack (`dataKeyId`); the Cloud SQL service agent is granted it here.
 *           Database users, caches and queues are not here.
 * Runtime: node
 * Governing contract: ADR 0186 (decisions 1 and 4), ADR 0238, ADR 0354 (open question 1, database only), ADR 0401.
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

import type { GcpRuntimeConfig } from "#core/types/gcp-runtime-config.type";
import { cloudProjectOf } from "#node/functions/cloud-project-of.function";
import { projectProvider } from "#node/functions/project-provider.function";
import { resolveRef } from "#node/functions/resolve-ref.function";
import type { GcpRuntimeOutputs } from "#node/types/gcp-runtime-outputs.type";

/**
 * The deployment's runtime.
 *
 * @param config - from `gcpRuntimeConfig(root, environment, dedicated?)`.
 * @param options.keyId - the deployment's data key (`gcpBaseline(...).dataKeyId`, or a stack reference to it).
 * @example
 * const runtime = gcpRuntime(gcpRuntimeConfig(root, "production"), { keyId: foundation.dataKeyId });
 */
export function gcpRuntime(
  config: GcpRuntimeConfig,
  options: { readonly keyId?: pulumi.Input<string> } = {},
  opts?: pulumi.ComponentResourceOptions,
): GcpRuntimeOutputs {
  const { deployment: prefix, region, database } = config;
  const cloud = cloudProjectOf(config.cloudProject, `the ${prefix} project`);
  const group = new pulumi.ComponentResource("stackra:infra-gcp:Runtime", prefix, {}, opts);
  const provider = projectProvider(
    `${prefix}-runtime`,
    { project: cloud.id, region, labels: config.labels },
    { parent: group },
  );
  const scoped = { parent: group, provider };
  if (database === null) return { databaseInstance: null, databaseConnection: null };

  const grants: pulumi.Resource[] = [];
  if (options.keyId !== undefined) {
    const agent = new gcp.projects.ServiceIdentity(
      `${prefix}-sql-agent`,
      { project: cloud.id, service: "sqladmin.googleapis.com" },
      scoped,
    );
    grants.push(
      new gcp.kms.CryptoKeyIAMMember(
        `${prefix}-sql-key`,
        {
          cryptoKeyId: options.keyId,
          role: "roles/cloudkms.cryptoKeyEncrypterDecrypter",
          member: pulumi.interpolate`serviceAccount:${agent.email}`,
        },
        scoped,
      ),
    );
  }

  const instance = new gcp.sql.DatabaseInstance(
    `${prefix}-postgres`,
    {
      project: cloud.id,
      region,
      databaseVersion: database.version,
      deletionProtection: true,
      ...(options.keyId !== undefined && { encryptionKeyName: options.keyId }),
      settings: {
        tier: database.tier,
        availabilityType: database.highAvailability ? "REGIONAL" : "ZONAL",
        deletionProtectionEnabled: true,
        userLabels: { ...config.labels },
        backupConfiguration: {
          enabled: true,
          location: region,
          pointInTimeRecoveryEnabled: database.pitr !== false,
          ...(database.pitr !== false &&
            database.pitr.days !== null && { transactionLogRetentionDays: database.pitr.days }),
          ...(database.retainedBackups !== null && {
            backupRetentionSettings: {
              retainedBackups: database.retainedBackups,
              retentionUnit: "COUNT",
            },
          }),
        },
        ipConfiguration:
          database.network === null
            ? { ipv4Enabled: true, sslMode: "ENCRYPTED_ONLY", authorizedNetworks: [] }
            : {
                ipv4Enabled: false,
                privateNetwork: resolveRef(database.network),
                sslMode: "ENCRYPTED_ONLY",
              },
      },
    },
    { ...scoped, dependsOn: grants },
  );
  return { databaseInstance: instance.name, databaseConnection: instance.connectionName };
}
