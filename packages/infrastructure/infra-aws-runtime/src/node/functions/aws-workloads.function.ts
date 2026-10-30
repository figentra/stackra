/**
 * Stackra file contract:
 * Purpose: `awsWorkloads(plan, options, securityGroup)`, the Pulumi program part that declares a runtime plan's
 *          container workloads on ECS Fargate: one cluster, a private DNS namespace and a log group per environment,
 *          the task execution role (reads only the environment's own SSM parameters), and per workload a task
 *          definition, a service registered in the namespace, and CPU target-tracking autoscaling when its maximum is
 *          above its minimum. A public workload also gets an ALB in the public subnets, HTTPS only, admitting
 *          Cloudflare's ranges alone, with a target group that checks the workload's health path.
 * Boundary: declares resources only, inside the Pulumi program that calls it; only the owner applies them. No secret
 *           value is created or read: each secret, its own and those of the resources it uses, is an SSM parameter
 *           the Infisical sync fills (`workloadParameter`). Tasks get no public address. The shared workload security
 *           group comes from `awsRuntime`, which also lets the databases admit it. A container health command is not
 *           added (images such as ZITADEL's have no shell); the load balancer checks public workloads.
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
import type { AwsRuntimeOptions } from "#node/types/aws-runtime-options.type";

/** The AWS-managed policy every task execution role carries (image pulls, log writes). */
const EXECUTION_POLICY = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy";

/** ALB and target group names allow 32 characters. */
const BALANCER_NAME_LIMIT = 32;

/** The CPU a service scales out at, in percent. */
const SCALE_AT_CPU = 60;

/** Days logs are kept when the options name none. */
const LOG_DAYS = 30;

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

  const prefix = resourceName([plan.project, plan.environment, "workloads"], BALANCER_NAME_LIMIT);
  const baseTags = { ...options.tags, env: plan.environment, service: "workloads" };
  const cluster = new aws.ecs.Cluster(prefix, {
    name: prefix,
    settings: [{ name: "containerInsights", value: "enabled" }],
    tags: baseTags,
  });
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
    ];
    const task = new aws.ecs.TaskDefinition(workload.name, {
      family: workload.name,
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: String(workload.cpu),
      memory: String(workload.memoryMb),
      executionRoleArn: executionRole.arn,
      containerDefinitions: pulumi.jsonStringify([
        {
          name: workload.workload,
          image: workload.image,
          essential: true,
          portMappings: [{ containerPort: workload.port, protocol: "tcp" }],
          environment: Object.entries(workload.env).map(([name, value]) => ({ name, value })),
          secrets,
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": logGroup.name,
              "awslogs-region": region.name,
              "awslogs-stream-prefix": workload.workload,
            },
          },
        },
      ]),
      tags,
    });
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
    if (workload.public && balancerGroup !== undefined && settings?.publicSubnetIds !== undefined) {
      const balancer = new aws.lb.LoadBalancer(workload.name, {
        name: workload.name,
        loadBalancerType: "application",
        internal: false,
        subnets: settings.publicSubnetIds,
        securityGroups: [balancerGroup.id],
        dropInvalidHeaderFields: true,
        tags,
      });
      targetGroup = new aws.lb.TargetGroup(workload.name, {
        name: resourceName([workload.name, "tg"], BALANCER_NAME_LIMIT),
        targetType: "ip",
        port: workload.port,
        protocol: "HTTP",
        vpcId,
        healthCheck: { path: workload.health, matcher: "200-399" },
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
        fromPort: workload.port,
        toPort: workload.port,
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
        launchType: "FARGATE",
        networkConfiguration: {
          subnets: options.network.subnetIds,
          securityGroups: [securityGroup],
          assignPublicIp: false,
        },
        serviceRegistries: { registryArn: registry.arn },
        loadBalancers:
          targetGroup === undefined
            ? undefined
            : [
                {
                  targetGroupArn: targetGroup.arn,
                  containerName: workload.workload,
                  containerPort: workload.port,
                },
              ],
        deploymentCircuitBreaker: { enable: true, rollback: true },
        tags,
      },
      { dependsOn: listener === undefined ? [] : [listener] },
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
