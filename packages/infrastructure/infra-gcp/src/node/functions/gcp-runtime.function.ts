/**
 * Stackra file contract:
 * Purpose: `gcpRuntime(config, options?, opts?)`, the Pulumi program of one deployment's GCP runtime: a provider pinned
 *          to its project and region, and its Cloud SQL Postgres server with daily backups kept in the deployment's
 *          region, point-in-time recovery when the runway asks, a standby when highly available, a private IP on the
 *          runway's VPC (else reachable only through the Cloud SQL connector over TLS), deletion protection, the
 *          deployment's data key when one is passed, and pgaudit (unless the runway turns it off): the Cloud SQL flags
 *          and a sink routing the server's pgaudit entries into a log bucket in its region, kept the runway's days; and
 *          the slow-statement log (unless the runway turns it off): `log_min_duration_statement` and `auto_explain`
 *          from `slowQueryMs`, so the server logs each slow statement with its plan.
 * Boundary: creates resources only through Pulumi; agents preview or run it under mocks, never `pulumi up`. The
 *           backup location is the instance's own region, so a backup never leaves the jurisdiction (ADR 0186). The
 *           data key comes from the foundation stack (`dataKeyId`); the Cloud SQL service agent is granted it here.
 *           Database users, caches and queues are not here, nor `create extension pgaudit` and per-role
 *           `pgaudit.log`, which run inside the database. Switching pgaudit on restarts the server once.
 * Runtime: node
 * Governing contract: ADR 0186 (decisions 1 and 4), ADR 0238, ADR 0354 (open question 1, database only), ADR 0401,
 *                     ADR 0212 (decisions 5 and 6: pgaudit, kept hot thirteen months), ADR 0227 (pgaudit, not CDC),
 *                     data-layer gap scale-performance 7 (STA-1400: the slow-statement log).
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

  const slowMs = database.slowQueryMs === false ? undefined : String(database.slowQueryMs);
  const databaseFlags = [
    ...(database.pgaudit === false
      ? []
      : [
          { name: "cloudsql.enable_pgaudit", value: "on" },
          { name: "pgaudit.log", value: database.pgaudit.log.join(",") },
        ]),
    ...(slowMs === undefined
      ? []
      : [
          { name: "log_min_duration_statement", value: slowMs },
          { name: "cloudsql.enable_auto_explain", value: "on" },
          { name: "auto_explain.log_min_duration", value: slowMs },
        ]),
  ];
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
        ...(databaseFlags.length > 0 && { databaseFlags }),
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
  if (database.pgaudit !== false) {
    // The bucket sits in the server's region so the audit trail stays in its jurisdiction, like the backups.
    const bucketId = `${prefix}-pgaudit`;
    const bucket = new gcp.logging.ProjectBucketConfig(
      bucketId,
      {
        project: cloud.id,
        location: region,
        bucketId,
        retentionDays: database.pgaudit.retentionDays,
        description: "pgaudit entries of the deployment's Cloud SQL server (ADR 0212)",
      },
      scoped,
    );
    new gcp.logging.ProjectSink(
      bucketId,
      {
        project: cloud.id,
        name: bucketId,
        destination: `logging.googleapis.com/projects/${cloud.id}/locations/${region}/buckets/${bucketId}`,
        filter: pulumi.interpolate`resource.type="cloudsql_database" AND resource.labels.database_id="${cloud.id}:${instance.name}" AND protoPayload.request.@type="type.googleapis.com/google.cloud.sql.audit.v1.PgAuditEntry"`,
        uniqueWriterIdentity: true,
      },
      { ...scoped, dependsOn: [bucket] },
    );
  }
  return { databaseInstance: instance.name, databaseConnection: instance.connectionName };
}
