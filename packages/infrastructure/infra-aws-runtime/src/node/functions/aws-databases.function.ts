/**
 * Stackra file contract:
 * Purpose: `awsDatabases(plan, options)`, the Pulumi program part that declares a runtime plan's Postgres resources:
 *          one subnet group, then per database a security group that admits port 5432 only from the runtime's security
 *          groups and the workloads' group, the RDS instance (or the Aurora cluster and its instances) encrypted with automated backups, and RDS
 *          Proxy in front with TLS required. RDS Proxy logs in with a Secrets Manager secret, so the admin password is
 *          also stored there for the proxy alone, read by a role only RDS Proxy may assume.
 * Boundary: declares resources only, inside the Pulumi program that calls it; only the owner applies them. The
 *           password arrives as a Pulumi secret input per database (generated in the deploy job and written blind to
 *           Infisical, ADR 0493 decision 4) and is never logged or returned. Dev and preview databases have no deletion
 *           protection and no final snapshot; staging and production keep both.
 * Runtime: node
 * Governing contract: ADR 0493 (decisions 2 and 4), ADR 0238 (RDS by default), ADR 0473 (RDS Proxy), ADR 0186
 *                     (decision 1: point-in-time recovery), ADR 0172 (decision 5: tags), ADR 0173.
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { resourceName } from "#core/functions/resource-name.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { RESOURCE_SECRETS_SETTINGS } from "#node/constants/resource-secrets-settings.constant";
import type { AwsRuntimeOptions } from "#node/types/aws-runtime-options.type";

/** The admin user every database is created with; services get their own roles (ADR 0238 decision 3). */
const ADMIN_USER = RESOURCE_SECRETS_SETTINGS.adminUser;

/** The Postgres port. */
const PORT = 5432;

/** The longest RDS subnet group name and RDS Proxy name. */
const NAME_LIMIT = 63;

/** Environments whose databases are throwaway. */
const THROWAWAY = new Set(["dev", "preview"]);

/**
 * Declares the Postgres resources of `plan` and returns each one's proxy endpoint, by plan key.
 *
 * @throws TypeError when the plan has a database and the options name no VPC or no password for it.
 * @param workloadGroups - the shared workload security group, when the plan has workloads; databases admit it too.
 * @example
 * const databases = awsDatabases(plan, { network, databasePasswords: { "resources.main-db": pulumi.secret(password) } });
 */
export function awsDatabases(
  plan: RuntimePlan,
  options: AwsRuntimeOptions,
  workloadGroups: readonly pulumi.Input<string>[] = [],
): Record<string, { endpoint: pulumi.Output<string>; port: number }> {
  const out: Record<string, { endpoint: pulumi.Output<string>; port: number }> = {};
  if (plan.databases.length === 0) return out;
  const vpcId = options.network.vpcId;
  if (vpcId === undefined) throw new TypeError("Name the VPC (network.vpcId) the databases run in");

  const throwaway = THROWAWAY.has(plan.environment);
  const groupName = resourceName([plan.project, plan.environment, "db"], NAME_LIMIT);
  const subnetGroup = new aws.rds.SubnetGroup(groupName, {
    name: groupName,
    subnetIds: options.network.subnetIds,
    tags: { ...options.tags, env: plan.environment, service: "shared" },
  });
  const proxyRole = new aws.iam.Role(`${groupName}-proxy`, {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        { Effect: "Allow", Principal: { Service: "rds.amazonaws.com" }, Action: "sts:AssumeRole" },
      ],
    }),
    tags: { ...options.tags, env: plan.environment, service: "shared" },
  });

  for (const database of plan.databases) {
    const password = options.databasePasswords?.[database.key];
    if (password === undefined) throw new TypeError(`No password input for ${database.key}`);
    const tags = { ...options.tags, ...database.tags };
    const securityGroup = new aws.ec2.SecurityGroup(database.name, {
      vpcId,
      description: `Postgres ${database.key}: port ${PORT} from the runtime only`,
      ingress: [
        {
          protocol: "tcp",
          fromPort: PORT,
          toPort: PORT,
          securityGroups: options.network.securityGroupIds,
        },
        ...(workloadGroups.length === 0
          ? []
          : [
              {
                protocol: "tcp",
                fromPort: PORT,
                toPort: PORT,
                securityGroups: [...workloadGroups],
              },
            ]),
        // The proxy reaches the database through the same group.
        { protocol: "tcp", fromPort: PORT, toPort: PORT, self: true },
      ],
      egress: [{ protocol: "tcp", fromPort: PORT, toPort: PORT, self: true }],
      tags,
    });
    const network = {
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: [securityGroup.id],
    };
    const lifecycle = {
      backupRetentionPeriod: database.backupDays,
      storageEncrypted: true,
      deletionProtection: !throwaway,
      skipFinalSnapshot: throwaway,
      ...(throwaway ? {} : { finalSnapshotIdentifier: `${database.name}-final` }),
      copyTagsToSnapshot: true,
    };

    let target:
      | { dbInstanceIdentifier: pulumi.Output<string> }
      | { dbClusterIdentifier: pulumi.Output<string> };
    if (database.engine === "aurora") {
      const cluster = new aws.rds.Cluster(database.name, {
        clusterIdentifier: database.name,
        engine: "aurora-postgresql",
        engineVersion: database.version,
        masterUsername: ADMIN_USER,
        masterPassword: password,
        ...network,
        ...lifecycle,
        tags,
      });
      for (let index = 0; index < (database.multiAz ? 2 : 1); index += 1)
        new aws.rds.ClusterInstance(`${database.name}-${index}`, {
          identifier: `${database.name}-${index}`,
          clusterIdentifier: cluster.id,
          engine: "aurora-postgresql",
          instanceClass: database.instanceClass,
          dbSubnetGroupName: subnetGroup.name,
          publiclyAccessible: false,
          tags,
        });
      target = { dbClusterIdentifier: cluster.id };
    } else {
      const instance = new aws.rds.Instance(database.name, {
        identifier: database.name,
        engine: "postgres",
        engineVersion: database.version,
        instanceClass: database.instanceClass,
        allocatedStorage: database.storageGb,
        multiAz: database.multiAz,
        username: ADMIN_USER,
        password,
        publiclyAccessible: false,
        autoMinorVersionUpgrade: true,
        ...network,
        ...lifecycle,
        tags,
      });
      target = { dbInstanceIdentifier: instance.identifier };
    }

    const secret = new aws.secretsmanager.Secret(database.name, {
      name: `${database.name}/rds-proxy`,
      description: `RDS Proxy login of ${database.key}; Infisical stays the source (ADR 0173)`,
      recoveryWindowInDays: throwaway ? 0 : 7,
      tags,
    });
    new aws.secretsmanager.SecretVersion(database.name, {
      secretId: secret.id,
      secretString: pulumi.jsonStringify({ username: ADMIN_USER, password }),
    });
    new aws.iam.RolePolicy(database.name, {
      role: proxyRole.id,
      policy: pulumi.jsonStringify({
        Version: "2012-10-17",
        Statement: [
          { Effect: "Allow", Action: "secretsmanager:GetSecretValue", Resource: secret.arn },
        ],
      }),
    });
    const proxyName = resourceName([database.name, "proxy"], NAME_LIMIT);
    const proxy = new aws.rds.Proxy(proxyName, {
      name: proxyName,
      engineFamily: "POSTGRESQL",
      auths: [{ authScheme: "SECRETS", secretArn: secret.arn, iamAuth: "DISABLED" }],
      roleArn: proxyRole.arn,
      vpcSubnetIds: options.network.subnetIds,
      vpcSecurityGroupIds: [securityGroup.id],
      requireTls: true,
      tags,
    });
    const targetGroup = new aws.rds.ProxyDefaultTargetGroup(proxyName, { dbProxyName: proxy.name });
    new aws.rds.ProxyTarget(proxyName, {
      dbProxyName: proxy.name,
      targetGroupName: targetGroup.name,
      ...target,
    });
    out[database.key] = { endpoint: proxy.endpoint, port: PORT };
  }
  return out;
}
