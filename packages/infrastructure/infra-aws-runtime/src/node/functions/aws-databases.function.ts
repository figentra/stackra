/**
 * Stackra file contract:
 * Purpose: `awsDatabases(plan, options)`, the Pulumi program part that declares a runtime plan's Postgres resources:
 *          one subnet group, then per database a security group that admits port 5432 only from the runtime's security
 *          groups and the workloads' group, the RDS instance (or the Aurora cluster and its instances) encrypted with automated backups, and RDS
 *          Proxy in front with TLS required. A database whose plan preloads extensions gets its own parameter group
 *          (a cluster parameter group on Aurora) setting `shared_preload_libraries`, applied at the next reboot. RDS Proxy logs in with a Secrets Manager secret, so the admin password is
 *          also stored there for the proxy alone, read by a role only RDS Proxy may assume. A database whose plan names
 *          extensions gets a one-shot Fargate task (`createExtensionsScript` in a pinned Postgres client image, in its
 *          own security group the database admits) that the deploy runs once per revision with the admin login,
 *          before any workload's migration, so a migration never meets a missing extension on a fresh server; the
 *          ECS cluster, log group and execution role it runs with are created once, for the first such database.
 * Boundary: declares resources only, inside the Pulumi program that calls it; only the owner applies them. The
 *           password arrives as a Pulumi secret input per database (generated in the deploy job and written blind to
 *           the vault, ADR 0493 decision 4, ADR 0525) and is never logged or returned. Dev and preview databases have no deletion
 *           protection and no final snapshot; staging and production keep both. The extensions task reads the password
 *           from the proxy's secret (`<secret>:password::`), so it is in no task definition, input or state, and only
 *           the setup execution role may read it. Each database's extensions run lands in `ready` under its resource
 *           name, for `awsWorkloads` to order migrations after it.
 * Runtime: node
 * Governing contract: ADR 0493 (decisions 2 and 4), ADR 0238 (RDS by default), ADR 0473 (RDS Proxy), ADR 0186
 *                     (decision 1: point-in-time recovery), ADR 0172 (decision 5: tags), ADR 0173, ADR 0160 (note of
 *                     2026-11-03: the preload; note of 2026-11-26: the extensions run before migrations, STA-2092).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { createExtensionsScript } from "@stackra/runway";

import { resourceName } from "#core/functions/resource-name.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { DATABASE_SETUP_SETTINGS } from "#node/constants/database-setup-settings.constant";
import { RESOURCE_SECRETS_SETTINGS } from "#node/constants/resource-secrets-settings.constant";
import { WORKLOAD_MIGRATION_PROVIDER } from "#node/constants/workload-migration-provider.constant";
import { taskExecutionRole } from "#node/functions/task-execution-role.function";
import type { AwsRuntimeOptions } from "#node/types/aws-runtime-options.type";

/** The admin user every database is created with; services get their own roles (ADR 0238 decision 3). */
const ADMIN_USER = RESOURCE_SECRETS_SETTINGS.adminUser;

/** The Postgres port. */
const PORT = 5432;

/** The longest RDS subnet group name and RDS Proxy name. */
const NAME_LIMIT = 63;

/** Environments whose databases are throwaway. */
const THROWAWAY = new Set(["dev", "preview"]);

/** The longest ECS cluster name. */
const CLUSTER_NAME_LIMIT = 255;

/** What the extensions tasks of one environment share: created once, for the first database that names extensions. */
type SetupShared = {
  readonly cluster: aws.ecs.Cluster;
  readonly group: aws.ec2.SecurityGroup;
  readonly logGroup: aws.cloudwatch.LogGroup;
  readonly role: aws.iam.Role;
  readonly region: pulumi.Output<string>;
};

/** The cluster, security group, log group and execution role the extensions tasks of `plan` run with. */
function setupShared(
  plan: RuntimePlan,
  options: AwsRuntimeOptions,
  vpcId: pulumi.Input<string>,
): SetupShared {
  const prefix = resourceName([plan.project, plan.environment, "db-setup"], CLUSTER_NAME_LIMIT);
  const tags = { ...options.tags, env: plan.environment, service: "db-setup" };
  const role = taskExecutionRole(`${prefix}-execution`, tags);
  return {
    cluster: new aws.ecs.Cluster(prefix, {
      name: prefix,
      settings: [{ name: "containerInsights", value: "enabled" }],
      tags,
    }),
    // Out on 443 for the image, Secrets Manager and the logs, and on 5432 to the databases, which admit only it.
    group: new aws.ec2.SecurityGroup(prefix, {
      vpcId,
      description: "Database setup tasks: out to Postgres and HTTPS only, nothing in",
      ingress: [],
      egress: [
        { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: PORT, toPort: PORT, cidrBlocks: ["0.0.0.0/0"] },
      ],
      tags,
    }),
    logGroup: new aws.cloudwatch.LogGroup(prefix, {
      name: `/${plan.project}/${plan.environment}/db-setup`,
      retentionInDays: options.workloads?.logRetentionDays ?? DATABASE_SETUP_SETTINGS.logDays,
      tags,
    }),
    role,
    region: aws.getRegionOutput().name,
  };
}

/**
 * Declares the Postgres resources of `plan` and returns each one's proxy endpoint, by plan key.
 *
 * @throws TypeError when the plan has a database and the options name no VPC or no password for it.
 * @param workloadGroups - the shared workload security group, when the plan has workloads; databases admit it too.
 * @param ready - filled with each database's extensions run, by resource name (`main-db`), for what must follow it.
 * @example
 * const databases = awsDatabases(plan, { network, databasePasswords: { "resources.main-db": pulumi.secret(password) } });
 */
export function awsDatabases(
  plan: RuntimePlan,
  options: AwsRuntimeOptions,
  workloadGroups: readonly pulumi.Input<string>[] = [],
  ready: Map<string, pulumi.Resource> = new Map(),
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
  const setup = plan.databases.some((database) => database.extensions.length > 0)
    ? setupShared(plan, options, vpcId)
    : undefined;

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
        ...(setup === undefined || database.extensions.length === 0
          ? []
          : [
              {
                protocol: "tcp",
                fromPort: PORT,
                toPort: PORT,
                securityGroups: [setup.group.id],
              },
            ]),
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

    // shared_preload_libraries is static: it takes effect at the next reboot, never mid-deploy.
    const preload =
      database.preloadLibraries.length === 0
        ? undefined
        : {
            name: database.name,
            family: `${database.engine === "aurora" ? "aurora-postgresql" : "postgres"}${database.version.split(".")[0]}`,
            description: `${database.key}: shared_preload_libraries ${database.preloadLibraries.join(",")}`,
            parameters: [
              {
                name: "shared_preload_libraries",
                value: database.preloadLibraries.join(","),
                applyMethod: "pending-reboot",
              },
            ],
            tags,
          };

    let target:
      | { dbInstanceIdentifier: pulumi.Output<string> }
      | { dbClusterIdentifier: pulumi.Output<string> };
    // Where the extensions task signs in, and what must exist before it can.
    let host: pulumi.Output<string>;
    const servers: pulumi.Resource[] = [];
    if (database.engine === "aurora") {
      const parameters =
        preload === undefined
          ? undefined
          : new aws.rds.ClusterParameterGroup(database.name, preload);
      const cluster = new aws.rds.Cluster(database.name, {
        clusterIdentifier: database.name,
        engine: "aurora-postgresql",
        engineVersion: database.version,
        dbClusterParameterGroupName: parameters?.name,
        masterUsername: ADMIN_USER,
        masterPassword: password,
        ...network,
        ...lifecycle,
        tags,
      });
      for (let index = 0; index < (database.multiAz ? 2 : 1); index += 1)
        servers.push(
          new aws.rds.ClusterInstance(`${database.name}-${index}`, {
            identifier: `${database.name}-${index}`,
            clusterIdentifier: cluster.id,
            engine: "aurora-postgresql",
            instanceClass: database.instanceClass,
            dbSubnetGroupName: subnetGroup.name,
            publiclyAccessible: false,
            tags,
          }),
        );
      target = { dbClusterIdentifier: cluster.id };
      host = cluster.endpoint;
    } else {
      const parameters =
        preload === undefined ? undefined : new aws.rds.ParameterGroup(database.name, preload);
      const instance = new aws.rds.Instance(database.name, {
        identifier: database.name,
        engine: "postgres",
        engineVersion: database.version,
        parameterGroupName: parameters?.name,
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
      host = instance.address;
      servers.push(instance);
    }

    const secret = new aws.secretsmanager.Secret(database.name, {
      name: `${database.name}/rds-proxy`,
      description: `RDS Proxy login of ${database.key}; the vault stays the source (ADR 0525)`,
      recoveryWindowInDays: throwaway ? 0 : 7,
      tags,
    });
    const secretVersion = new aws.secretsmanager.SecretVersion(database.name, {
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

    if (setup !== undefined && database.extensions.length > 0) {
      const setupName = `${database.name}-extensions`;
      const access = new aws.iam.RolePolicy(setupName, {
        role: setup.role.id,
        policy: pulumi.jsonStringify({
          Version: "2012-10-17",
          Statement: [
            { Effect: "Allow", Action: "secretsmanager:GetSecretValue", Resource: secret.arn },
          ],
        }),
      });
      const registry = options.workloads?.registry;
      // The script names the extensions and the host is in the environment, so either change makes a new revision.
      const task = new aws.ecs.TaskDefinition(setupName, {
        family: setupName,
        networkMode: "awsvpc",
        requiresCompatibilities: ["FARGATE"],
        cpu: DATABASE_SETUP_SETTINGS.cpu,
        memory: DATABASE_SETUP_SETTINGS.memoryMb,
        executionRoleArn: setup.role.arn,
        containerDefinitions: pulumi.jsonStringify([
          {
            name: DATABASE_SETUP_SETTINGS.container,
            image:
              registry === undefined
                ? DATABASE_SETUP_SETTINGS.image
                : pulumi.interpolate`${registry}/${DATABASE_SETUP_SETTINGS.registryImage}`,
            essential: true,
            command: ["sh", "-c", createExtensionsScript(database.extensions)],
            environment: [
              { name: "PGHOST", value: host },
              { name: "PGPORT", value: String(PORT) },
              { name: "PGUSER", value: ADMIN_USER },
              { name: "PGSSLMODE", value: "require" },
              { name: "PGCONNECT_TIMEOUT", value: "10" },
            ],
            secrets: [
              { name: "PGPASSWORD", valueFrom: pulumi.interpolate`${secret.arn}:password::` },
            ],
            logConfiguration: {
              logDriver: "awslogs",
              options: {
                "awslogs-group": setup.logGroup.name,
                "awslogs-region": setup.region,
                "awslogs-stream-prefix": database.resource,
              },
            },
          },
        ]),
        tags,
      });
      // dynamic.Resource is abstract, so the run gets an empty subclass of its own
      const run = new (class DatabaseExtensions extends pulumi.dynamic.Resource {})(
        WORKLOAD_MIGRATION_PROVIDER,
        setupName,
        {
          name: database.name,
          purpose: "extensions",
          region: setup.region,
          cluster: setup.cluster.arn,
          taskDefinition: task.arn,
          container: DATABASE_SETUP_SETTINGS.container,
          subnets: options.network.subnetIds,
          securityGroups: [setup.group.id],
          timeoutMinutes: DATABASE_SETUP_SETTINGS.timeoutMinutes,
          pollSeconds: DATABASE_SETUP_SETTINGS.pollSeconds,
        },
        { dependsOn: [...servers, securityGroup, secretVersion, access] },
      );
      ready.set(database.resource, run);
    }
  }
  return out;
}
