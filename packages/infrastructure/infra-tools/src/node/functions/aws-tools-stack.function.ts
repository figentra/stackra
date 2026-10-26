/**
 * Stackra file contract:
 * Purpose: `awsToolsStack(plan, regionKey, options?)`, the Pulumi program part that declares one AWS region's
 *          self-hosted tools stack from a `ToolsStackPlan`: an AWS provider pinned to the region and its account, an
 *          ECS cluster, a private DNS namespace in the region's VPC, one log group, the task execution role (reads only
 *          the stack's own parameters), an encrypted EFS file system for the tools that keep data, and per tool a
 *          Fargate task definition and service, registered in the namespace when it serves an endpoint.
 * Boundary: declares resources only, inside the Pulumi program that calls it; agents only preview, the owner applies.
 *           No secret value is created or read: each secret variable is an SSM parameter the Infisical sync writes
 *           (ADR 0173). Services get no public address. A region on another cloud is refused (the GCP program is not
 *           built yet).
 * Runtime: node
 * Governing contract: owner decision R3-5 (2026-10-26); ADR 0444; ADR 0171 (decisions 2, 3 and 5); ADR 0172 (no IAM
 *                     users; cost tags); ADR 0173 (no secret values).
 */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import type { ToolsStackPlan } from "#core/types/tools-stack-plan.type";
import { resolveRef } from "#node/functions/resolve-ref.function";
import type { AwsToolsStack } from "#node/types/aws-tools-stack.type";

/** The AWS-managed policy every Fargate task execution role carries (image pulls, log writes). */
const EXECUTION_POLICY = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy";

/**
 * Declares the tools stack of `regionKey` and returns its ids and endpoints.
 *
 * @param plan - one environment's plan, from `toolsStackPlan` or `readToolsStackPlan`.
 * @param regionKey - the root runway region this stack runs in.
 * @param options - extra tags on every resource.
 * @throws Error when the plan has no such region or the region is not on AWS.
 * @example
 * // figentra/infra, os/production-tools-gcc/index.ts
 * export const tools = awsToolsStack(readToolsStackPlan("../os", "production"), "gcc");
 * export const endpoints = tools.endpoints;
 */
export function awsToolsStack(
  plan: ToolsStackPlan,
  regionKey: string,
  options: { readonly tags?: Readonly<Record<string, string>> } = {},
): AwsToolsStack {
  const region = plan.regions.find((candidate) => candidate.key === regionKey);
  if (region === undefined)
    throw new Error(`The ${plan.environment} tools stack does not run in region "${regionKey}"`);
  if (region.cloud !== "aws")
    throw new Error(
      `Region "${regionKey}" runs on ${region.cloud}: only the AWS tools stack is built (ADR 0444)`,
    );
  const network = region.network;
  if (network === undefined) throw new Error(`Region "${regionKey}" names no tools network`);

  const prefix = `${plan.project}-${plan.environment}-${regionKey}-tools`;
  const provider = new aws.Provider(prefix, {
    region: region.location as aws.Region,
    allowedAccountIds: region.account === undefined ? undefined : [resolveRef(region.account)],
    defaultTags: {
      tags: {
        ...options.tags,
        project: plan.project,
        env: plan.environment,
        service: "tools",
        region: regionKey,
      },
    },
  });
  const opts = { provider };
  const subnets = network.subnetIds.map((id) => resolveRef(id));
  const securityGroups = network.securityGroupIds.map((id) => resolveRef(id));

  const cluster = new aws.ecs.Cluster(
    prefix,
    { name: prefix, settings: [{ name: "containerInsights", value: "enabled" }] },
    opts,
  );
  const namespace = new aws.servicediscovery.PrivateDnsNamespace(
    prefix,
    { name: region.namespace, vpc: resolveRef(network.vpcId) },
    opts,
  );
  const logGroup = new aws.cloudwatch.LogGroup(
    prefix,
    {
      name: `/${plan.project}/${plan.environment}/tools/${regionKey}`,
      retentionInDays: region.logRetentionDays,
    },
    opts,
  );

  const caller = aws.getCallerIdentityOutput({}, opts);
  const parameterPaths = [
    ...new Set(
      region.tools.flatMap((tool) =>
        tool.secrets.map((secret) => secret.parameter.slice(0, secret.parameter.lastIndexOf("/"))),
      ),
    ),
  ];
  const executionRole = new aws.iam.Role(
    `${prefix}-execution`,
    {
      name: `${prefix}-execution`,
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
    },
    opts,
  );
  // oxlint-disable-next-line no-new -- reason: Pulumi registers a resource when it is constructed
  new aws.iam.RolePolicyAttachment(
    `${prefix}-execution`,
    { role: executionRole.name, policyArn: EXECUTION_POLICY },
    opts,
  );
  if (parameterPaths.length > 0)
    // oxlint-disable-next-line no-new -- reason: Pulumi registers a resource when it is constructed
    new aws.iam.RolePolicy(
      `${prefix}-parameters`,
      {
        role: executionRole.id,
        policy: pulumi.jsonStringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: "ssm:GetParameters",
              Resource: parameterPaths.map(
                (path) =>
                  pulumi.interpolate`arn:aws:ssm:${region.location}:${caller.accountId}:parameter${path}/*`,
              ),
            },
          ],
        }),
      },
      opts,
    );

  const keepsData = region.tools.some((tool) => tool.volume !== undefined);
  const fileSystem = keepsData
    ? new aws.efs.FileSystem(prefix, { encrypted: true, tags: { Name: prefix } }, opts)
    : undefined;
  const mountTargets =
    fileSystem === undefined
      ? []
      : subnets.map(
          (subnetId, index) =>
            new aws.efs.MountTarget(
              `${prefix}-${index}`,
              { fileSystemId: fileSystem.id, subnetId, securityGroups },
              opts,
            ),
        );

  const services: Record<string, pulumi.Output<string>> = {};
  for (const tool of region.tools) {
    // shortcut: one EFS directory per tool, world-writable at creation so any image user can own it; Nominatim's
    // Postgres on EFS is slow — move it to an EC2 capacity provider with EBS when its import time hurts.
    const accessPoint =
      fileSystem === undefined || tool.volume === undefined
        ? undefined
        : new aws.efs.AccessPoint(
            tool.name,
            {
              fileSystemId: fileSystem.id,
              rootDirectory: {
                path: `/${tool.key}`,
                creationInfo: { ownerUid: 0, ownerGid: 0, permissions: "777" },
              },
            },
            opts,
          );

    const container = {
      name: tool.key,
      image: tool.image,
      essential: true,
      command: tool.command,
      portMappings: tool.port === undefined ? [] : [{ containerPort: tool.port, protocol: "tcp" }],
      environment: Object.entries(tool.environment).map(([name, value]) => ({ name, value })),
      secrets: tool.secrets.map((secret) => ({ name: secret.name, valueFrom: secret.parameter })),
      mountPoints:
        tool.volume === undefined ? [] : [{ sourceVolume: "data", containerPath: tool.volume }],
      logConfiguration: {
        logDriver: "awslogs",
        options: {
          "awslogs-group": logGroup.name,
          "awslogs-region": region.location,
          "awslogs-stream-prefix": tool.key,
        },
      },
    };
    const task = new aws.ecs.TaskDefinition(
      tool.name,
      {
        family: tool.name,
        networkMode: "awsvpc",
        requiresCompatibilities: ["FARGATE"],
        cpu: String(tool.cpu),
        memory: String(tool.memoryMb),
        executionRoleArn: executionRole.arn,
        containerDefinitions: pulumi.jsonStringify([container]),
        volumes:
          accessPoint === undefined || fileSystem === undefined
            ? []
            : [
                {
                  name: "data",
                  efsVolumeConfiguration: {
                    fileSystemId: fileSystem.id,
                    transitEncryption: "ENABLED",
                    authorizationConfig: { accessPointId: accessPoint.id, iam: "DISABLED" },
                  },
                },
              ],
      },
      opts,
    );

    const registry =
      tool.endpoint === undefined
        ? undefined
        : new aws.servicediscovery.Service(
            tool.name,
            {
              name: tool.key,
              namespaceId: namespace.id,
              dnsConfig: {
                namespaceId: namespace.id,
                routingPolicy: "MULTIVALUE",
                dnsRecords: [{ type: "A", ttl: 10 }],
              },
            },
            opts,
          );

    const service = new aws.ecs.Service(
      tool.name,
      {
        name: tool.name,
        cluster: cluster.arn,
        taskDefinition: task.arn,
        desiredCount: tool.replicas,
        launchType: "FARGATE",
        networkConfiguration: { subnets, securityGroups, assignPublicIp: false },
        serviceRegistries: registry === undefined ? undefined : { registryArn: registry.arn },
        deploymentCircuitBreaker: { enable: true, rollback: true },
      },
      { ...opts, dependsOn: mountTargets },
    );
    services[tool.key] = service.id;
  }

  return {
    cluster: cluster.arn,
    namespace: namespace.id,
    services,
    endpoints: region.tools.flatMap((tool) => (tool.endpoint === undefined ? [] : [tool.endpoint])),
  };
}
