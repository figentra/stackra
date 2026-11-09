/**
 * Stackra file contract:
 * Purpose: `awsWorkloads(plan, options, securityGroup)`, the Pulumi program part that declares a runtime plan's
 *          container workloads on ECS Fargate: one cluster, a private DNS namespace and a log group per environment,
 *          the task execution role (reads only the environment's own SSM parameters), and per workload a task
 *          definition (its arguments, and each `aliases` name reading its resource variable's parameter), a service
 *          registered in the namespace, and CPU target-tracking autoscaling when its maximum is above its minimum.
 *          A workload with `migrate` also gets a migration task definition (the same container with the migration's
 *          arguments and no port) that `WORKLOAD_MIGRATION_PROVIDER` runs once per revision; its service waits for it.
 *          A public workload also gets an ALB in the public subnets, HTTPS only, admitting Cloudflare's ranges alone,
 *          with a target group that checks the workload's health path. A worker with no port (a queue consumer) gets
 *          no port mapping, and its `healthCommand`, when it names one, as the container's health check.
 * Boundary: declares resources only, inside the Pulumi program that calls it; only the owner applies them. No secret
 *           value is created or read: each secret, its own and those of the resources it uses, is an SSM parameter
 *           the secrets sync fills (`workloadParameter`). Tasks get no public address. The shared workload security
 *           group comes from `awsRuntime`, which also lets the databases admit it. A container health command is added
 *           only when the workload names one, run without a shell (`CMD`), since images such as ZITADEL's have none;
 *           the load balancer checks public workloads.
 * Runtime: node
 * Governing contract: ADR 0493 (decisions 2 and 4, owner answers Q5 and Q6), ADR 0444 (decision 4: Fargate, SSM),
 *                     ADR 0172 (decision 5: tags), ADR 0173 (no secret values).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { consumerVariables } from "#core/functions/consumer-variables.function";
import { resourceName } from "#core/functions/resource-name.function";
import { resourceVariables } from "#core/functions/resource-variables.function";
import { workloadParameter } from "#core/functions/workload-parameter.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { CLOUDFLARE_IPV4_RANGES } from "#node/constants/cloudflare-ipv4-ranges.constant";
import { WORKLOAD_MIGRATION_PROVIDER } from "#node/constants/workload-migration-provider.constant";
import type { AwsRuntimeOptions } from "#node/types/aws-runtime-options.type";

/** The AWS-managed policy every task execution role carries (image pulls, log writes). */
const EXECUTION_POLICY = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy";

/** ALB and target group names allow 32 characters. */
const BALANCER_NAME_LIMIT = 32;

/**
 * How long a public workload's load balancer keeps a quiet connection, in seconds: above an AI answer streamed as
 * server-sent events (60 to 120 s, a ping every 15 s), where the ALB default of 60 would cut a slow stream.
 */
const BALANCER_IDLE_TIMEOUT_SECONDS = 180;

/** The CPU a service scales out at, in percent. */
const SCALE_AT_CPU = 60;

/** Seconds between two looks at a running migration task. */
const MIGRATE_POLL_SECONDS = 10;

/** Days logs are kept when the options name none. */
const LOG_DAYS = 30;

/** Seconds between a worker's health command runs. */
const HEALTH_COMMAND_INTERVAL_SECONDS = 30;

/** What each workload exposes, by plan key. */
type WorkloadOutputs = Record<
  string,
  { service: pulumi.Output<string>; internalHost: string; publicHost?: pulumi.Output<string> }
>;

/**
 * Declares the workloads of `plan` and returns each one's service, internal host and public host.
 *
 * @param securityGroup - the shared workload security group `awsRuntime` created.
 * @throws TypeError when the plan has a workload and the options name no VPC, or a public one and no public subnets or
 *         certificate.
 * @example
 * const workloads = awsWorkloads(plan, options, workloadGroup.id);
 */
export function awsWorkloads(
  plan: RuntimePlan,
  options: AwsRuntimeOptions,
  securityGroup: pulumi.Input<string>,
): WorkloadOutputs {
  const out: WorkloadOutputs = {};
  if (plan.workloads.length === 0) return out;
  const vpcId = options.network.vpcId;
  if (vpcId === undefined) throw new TypeError("Name the VPC (network.vpcId) the workloads run in");
  const settings = options.workloads;
  if (
    plan.workloads.some((workload) => workload.public) &&
    (settings?.publicSubnetIds === undefined || settings.certificateArn === undefined)
  )
    throw new TypeError(
      "A public workload needs workloads.publicSubnetIds and workloads.certificateArn",
    );
  if (plan.workloads.some((workload) => workload.registryImage) && settings?.registry === undefined)
    throw new TypeError(
      "A gotenberg resource pulls through ECR: name workloads.registry (<account>.dkr.ecr.<region>.amazonaws.com)",
    );

  const prefix = resourceName([plan.project, plan.environment, "workloads"], BALANCER_NAME_LIMIT);
  const baseTags = { ...options.tags, env: plan.environment, service: "workloads" };
  const cluster = new aws.ecs.Cluster(prefix, {
    name: prefix,
    settings: [{ name: "containerInsights", value: "enabled" }],
    tags: baseTags,
  });
  // FARGATE_SPOT for the workloads that may take an interruption (dev and staging engines); the rest stay on FARGATE.
  const capacity = plan.workloads.some((workload) => workload.spot)
    ? new aws.ecs.ClusterCapacityProviders(prefix, {
        clusterName: cluster.name,
        capacityProviders: ["FARGATE", "FARGATE_SPOT"],
      })
    : undefined;
  const domain = `${plan.environment}.workloads.${plan.project}.internal`;
  const namespace = new aws.servicediscovery.PrivateDnsNamespace(prefix, {
    name: domain,
    vpc: vpcId,
    tags: baseTags,
  });
  const logGroup = new aws.cloudwatch.LogGroup(prefix, {
    name: `/${plan.project}/${plan.environment}/workloads`,
    retentionInDays: settings?.logRetentionDays ?? LOG_DAYS,
    tags: baseTags,
  });

  const region = aws.getRegionOutput();
  const caller = aws.getCallerIdentityOutput();
  const executionRole = new aws.iam.Role(`${prefix}-execution`, {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "ecs-tasks.amazonaws.com" },
          Action: "sts:AssumeRole",
        },
      ],
    }),
    tags: baseTags,
  });
  new aws.iam.RolePolicyAttachment(`${prefix}-execution`, {
    role: executionRole.name,
    policyArn: EXECUTION_POLICY,
  });
  new aws.iam.RolePolicy(`${prefix}-parameters`, {
    role: executionRole.id,
    policy: pulumi.jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: "ssm:GetParameters",
          Resource: pulumi.interpolate`arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${plan.project}/${plan.environment}/*`,
        },
      ],
    }),
  });

  const balancerGroup = plan.workloads.some((workload) => workload.public)
    ? new aws.ec2.SecurityGroup(`${prefix}-alb`, {
        vpcId,
        description: "Public workloads' load balancers: HTTPS from Cloudflare only",
        ingress: [
          { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: [...CLOUDFLARE_IPV4_RANGES] },
        ],
        egress: [{ protocol: "-1", fromPort: 0, toPort: 0, securityGroups: [securityGroup] }],
        tags: baseTags,
      })
    : undefined;
  const variables = consumerVariables(plan);

  for (const workload of plan.workloads) {
    const tags = { ...options.tags, ...workload.tags };
    const image =
      workload.registryImage && settings?.registry !== undefined
        ? pulumi.interpolate`${settings.registry}/${workload.image}`
        : workload.image;
    // A PDF engine gets its own group: in from the consumers and the other workloads on its port, out on 443 only.
    const groups: pulumi.Input<string>[] =
      workload.httpsEgressOnly && workload.port !== undefined
        ? [
            new aws.ec2.SecurityGroup(`${workload.name}-sg`, {
              vpcId,
              description: `${workload.key}: in on ${workload.port} from the consumers, out on 443 only`,
              ingress: [
                {
                  protocol: "tcp",
                  fromPort: workload.port,
                  toPort: workload.port,
                  securityGroups: pulumi
                    .all([securityGroup, options.network.securityGroupIds])
                    .apply(([own, consumers]) => [own, ...consumers]),
                },
              ],
              egress: [{ protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] }],
              tags,
            }).id,
          ]
        : [securityGroup];
    // Its own secrets, then the variables of each resource it uses, each from the folder the sync mirrors.
    const secrets = [
      ...workload.secrets.map((name) => ({
        name,
        valueFrom: workloadParameter(plan, `workloads/${workload.workload}`, name),
      })),
      ...workload.uses.flatMap((resource) =>
        Object.values(resourceVariables(resource))
          .filter((name) => variables[workload.workload]?.includes(name) === true)
          .map((name) => ({
            name,
            valueFrom: workloadParameter(plan, `runtime/${resource}`, name),
          })),
      ),
      // The same parameters under the names the image reads (`runtimePlan` checked each target is published).
      ...Object.entries(workload.aliases).flatMap(([name, variable]) =>
        workload.uses
          .filter((resource) => Object.values(resourceVariables(resource)).includes(variable))
          .map((resource) => ({
            name,
            valueFrom: workloadParameter(plan, `runtime/${resource}`, variable),
          })),
      ),
    ];
    // One container: the service with its port and health command, or the migration with its own arguments and neither.
    const containerOf = (
      command: readonly string[],
      streamPrefix: string,
      port?: number,
      healthCommand: readonly string[] = [],
    ) => ({
      name: workload.workload,
      image,
      ...(command.length > 0 ? { command } : {}),
      essential: true,
      ...(port === undefined ? {} : { portMappings: [{ containerPort: port, protocol: "tcp" }] }),
      ...(healthCommand.length === 0
        ? {}
        : {
            healthCheck: {
              command: ["CMD", ...healthCommand],
              interval: HEALTH_COMMAND_INTERVAL_SECONDS,
              timeout: 5,
              retries: 3,
              startPeriod: 60,
            },
          }),
      environment: Object.entries(workload.env).map(([name, value]) => ({ name, value })),
      secrets,
      logConfiguration: {
        logDriver: "awslogs",
        options: {
          "awslogs-group": logGroup.name,
          "awslogs-region": region.name,
          "awslogs-stream-prefix": streamPrefix,
        },
      },
    });
    const taskArgs = {
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: String(workload.cpu),
      memory: String(workload.memoryMb),
      executionRoleArn: executionRole.arn,
      tags,
    };
    const task = new aws.ecs.TaskDefinition(workload.name, {
      ...taskArgs,
      family: workload.name,
      containerDefinitions: pulumi.jsonStringify([
        containerOf(workload.command, workload.workload, workload.port, workload.healthCommand),
      ]),
    });

    // The migration runs once per revision, before the service rolls; a failed run stops the rollout.
    let migration: pulumi.Resource | undefined;
    if (workload.migrate !== undefined) {
      const migrateName = `${workload.name}-migrate`;
      const migrateTask = new aws.ecs.TaskDefinition(migrateName, {
        ...taskArgs,
        family: migrateName,
        containerDefinitions: pulumi.jsonStringify([
          containerOf(workload.migrate.command, `${workload.workload}-migrate`),
        ]),
      });
      // dynamic.Resource is abstract, so the run gets an empty subclass of its own
      migration = new (class WorkloadMigration extends pulumi.dynamic.Resource {})(
        WORKLOAD_MIGRATION_PROVIDER,
        migrateName,
        {
          name: workload.name,
          region: region.name,
          cluster: cluster.arn,
          taskDefinition: migrateTask.arn,
          container: workload.workload,
          subnets: options.network.subnetIds,
          securityGroups: [securityGroup],
          timeoutMinutes: workload.migrate.timeoutMinutes,
          pollSeconds: MIGRATE_POLL_SECONDS,
        },
      );
    }
    const registry = new aws.servicediscovery.Service(workload.name, {
      name: workload.workload,
      namespaceId: namespace.id,
      dnsConfig: {
        namespaceId: namespace.id,
        routingPolicy: "MULTIVALUE",
        dnsRecords: [{ type: "A", ttl: 10 }],
      },
      tags,
    });

    let targetGroup: aws.lb.TargetGroup | undefined;
    let listener: aws.lb.Listener | undefined;
    let publicHost: pulumi.Output<string> | undefined;
    const { port, health } = workload;
    if (
      workload.public &&
      port !== undefined &&
      health !== undefined &&
      balancerGroup !== undefined &&
      settings?.publicSubnetIds !== undefined
    ) {
      const balancer = new aws.lb.LoadBalancer(workload.name, {
        name: workload.name,
        loadBalancerType: "application",
        internal: false,
        subnets: settings.publicSubnetIds,
        securityGroups: [balancerGroup.id],
        dropInvalidHeaderFields: true,
        idleTimeout: BALANCER_IDLE_TIMEOUT_SECONDS,
        tags,
      });
      targetGroup = new aws.lb.TargetGroup(workload.name, {
        name: resourceName([workload.name, "tg"], BALANCER_NAME_LIMIT),
        targetType: "ip",
        port,
        protocol: "HTTP",
        vpcId,
        healthCheck: { path: health, matcher: "200-399" },
        tags,
      });
      listener = new aws.lb.Listener(workload.name, {
        loadBalancerArn: balancer.arn,
        port: 443,
        protocol: "HTTPS",
        sslPolicy: "ELBSecurityPolicy-TLS13-1-2-2021-06",
        certificateArn: settings.certificateArn,
        defaultActions: [{ type: "forward", targetGroupArn: targetGroup.arn }],
        tags,
      });
      publicHost = balancer.dnsName;
      new aws.ec2.SecurityGroupRule(workload.name, {
        type: "ingress",
        protocol: "tcp",
        fromPort: port,
        toPort: port,
        securityGroupId: securityGroup,
        sourceSecurityGroupId: balancerGroup.id,
        description: `${workload.key} from its load balancer`,
      });
    }

    const service = new aws.ecs.Service(
      workload.name,
      {
        name: workload.name,
        cluster: cluster.arn,
        taskDefinition: task.arn,
        desiredCount: workload.scale.min,
        ...(workload.spot
          ? { capacityProviderStrategies: [{ capacityProvider: "FARGATE_SPOT", weight: 1 }] }
          : { launchType: "FARGATE" }),
        networkConfiguration: {
          subnets: options.network.subnetIds,
          securityGroups: groups,
          assignPublicIp: false,
        },
        serviceRegistries: { registryArn: registry.arn },
        loadBalancers:
          targetGroup === undefined || port === undefined
            ? undefined
            : [
                {
                  targetGroupArn: targetGroup.arn,
                  containerName: workload.workload,
                  containerPort: port,
                },
              ],
        deploymentCircuitBreaker: { enable: true, rollback: true },
        tags,
      },
      {
        dependsOn: [
          ...(listener === undefined ? [] : [listener]),
          ...(migration === undefined ? [] : [migration]),
          ...(workload.spot && capacity !== undefined ? [capacity] : []),
        ],
      },
    );

    if (workload.scale.max > workload.scale.min) {
      const target = new aws.appautoscaling.Target(workload.name, {
        serviceNamespace: "ecs",
        scalableDimension: "ecs:service:DesiredCount",
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        minCapacity: workload.scale.min,
        maxCapacity: workload.scale.max,
      });
      new aws.appautoscaling.Policy(workload.name, {
        policyType: "TargetTrackingScaling",
        serviceNamespace: target.serviceNamespace,
        scalableDimension: target.scalableDimension,
        resourceId: target.resourceId,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: SCALE_AT_CPU,
          predefinedMetricSpecification: {
            predefinedMetricType: "ECSServiceAverageCPUUtilization",
          },
        },
      });
    }

    out[workload.key] = {
      service: service.name,
      internalHost: `${workload.workload}.${domain}`,
      ...(publicHost === undefined ? {} : { publicHost }),
    };
  }
  return out;
}
