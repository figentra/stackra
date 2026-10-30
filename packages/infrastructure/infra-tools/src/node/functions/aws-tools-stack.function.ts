/**
 * Stackra file contract:
 * Purpose: `awsToolsStack(plan, regionKey, options?)`, the Pulumi program part that declares one AWS region's
 *          self-hosted tools stack from a `ToolsStackPlan`: an AWS provider pinned to the region and its account, an
 *          ECS cluster, a private DNS namespace in the region's VPC, one log group, the task execution role (reads only
 *          the stack's own parameters), an encrypted EFS file system for the tools that keep data there, one EC2
 *          instance with an encrypted EBS disk per tool that keeps data on EBS (Nominatim's Postgres), a GPU capacity
 *          provider per GPU instance type (launch template on the ECS GPU-optimised image, an Auto Scaling group from
 *          zero, one GPU per task) for the tools flagged `gpu`, a Valkey
 *          replication group when a tool reads a cache URL, the one-shot task that creates the tools' databases on
 *          the shared Postgres server, the role Infisical assumes to sync the parameters, and per tool a task
 *          definition and service, registered in the namespace when it serves an endpoint.
 * Boundary: declares resources only, inside the Pulumi program that calls it; agents only preview, the owner applies.
 *           No secret value is created or read: each secret variable is an SSM parameter the Infisical sync writes
 *           (ADR 0173), so the Valkey runs without an auth token, reachable only in the VPC and over TLS. The deploy
 *           runs the database task (`aws ecs run-task`); Pulumi never runs it. Services get no public address. A
 *           region on another cloud is refused (the GCP program is not built yet).
 * Runtime: node
 * Governing contract: owner decision R3-5 (2026-10-26); ADR 0444; ADR 0171 (decisions 2, 3 and 5); ADR 0172 (no IAM
 *                     users; cost tags); ADR 0173 (no secret values); ADR 0238 (databases on the shared server).
 */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import type { ToolPlan } from "#core/types/tool-plan.type";
import type { ToolsStackPlan } from "#core/types/tools-stack-plan.type";
import { databasePasswordVariable } from "#node/functions/database-password-variable.function";
import { databaseScript } from "#node/functions/database-script.function";
import { resolveRef } from "#node/functions/resolve-ref.function";
import type { AwsToolsStack } from "#node/types/aws-tools-stack.type";

/** The AWS-managed policy every task execution role carries (image pulls, log writes). */
const EXECUTION_POLICY = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy";

/** The AWS-managed policy an ECS container instance carries. */
const INSTANCE_POLICY = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role";

/** The current ECS-optimised Amazon Linux 2023 image, published by AWS as a public parameter. */
const ECS_AMI_PARAMETER = "/aws/service/ecs/optimized-ami/amazon-linux-2023/recommended/image_id";

/** The ECS-optimised GPU image (NVIDIA drivers and container runtime), published by AWS as a public parameter. */
const ECS_GPU_AMI_PARAMETER =
  "/aws/service/ecs/optimized-ami/amazon-linux-2023/gpu/recommended/image_id";

/** The root disk of a GPU instance in GiB: the CUDA images and model downloads need more than the AMI's 30. */
const GPU_ROOT_DISK_GB = 100;

/** The pinned Postgres client image the database task runs. */
const POSTGRES_CLIENT_IMAGE = "postgres:17.6-alpine";

/** The Valkey engine version. */
const VALKEY_VERSION = "8.0";

/** Where an EC2 instance mounts its EBS disk; each tool's data is a folder under it. */
const EBS_MOUNT = "/data";

/** The instance attribute a tool's service is placed by. */
const TOOL_ATTRIBUTE = "stackra.tool";

/** The parameter folder of `parameter` (`/a/b/NAME` to `/a/b`). */
function folderOf(parameter: string): string {
  return parameter.slice(0, parameter.lastIndexOf("/"));
}

/** Whether `tool` runs on the GPU capacity provider. */
function onGpu(tool: ToolPlan): boolean {
  return tool.gpu !== undefined;
}

/** Whether `tool` keeps its volume on an EC2 instance's EBS disk. */
function onEbs(tool: ToolPlan): boolean {
  return tool.volume !== undefined && tool.ebs !== undefined;
}

/** A trust document that lets the AWS service `service` assume the role. */
function assumedBy(service: string): string {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [{ Effect: "Allow", Principal: { Service: service }, Action: "sts:AssumeRole" }],
  });
}

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
  const firstSubnet = subnets[0] ?? "";

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
  const logging = (stream: string) => ({
    logDriver: "awslogs",
    options: {
      "awslogs-group": logGroup.name,
      "awslogs-region": region.location,
      "awslogs-stream-prefix": stream,
    },
  });

  const caller = aws.getCallerIdentityOutput({}, opts);
  const parameterArn = (path: string) =>
    pulumi.interpolate`arn:aws:ssm:${region.location}:${caller.accountId}:parameter${path}/*`;
  const parameterPaths = [
    ...new Set([
      ...region.tools.flatMap((tool) => tool.secrets.map((secret) => folderOf(secret.parameter))),
      ...region.databases.map((database) => folderOf(database.passwordParameter)),
      ...region.databaseAdmin.map((secret) => folderOf(secret.parameter)),
    ]),
  ];
  const executionRole = new aws.iam.Role(
    `${prefix}-execution`,
    { name: `${prefix}-execution`, assumeRolePolicy: assumedBy("ecs-tasks.amazonaws.com") },
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
              Resource: parameterPaths.map(parameterArn),
            },
          ],
        }),
      },
      opts,
    );

  // The role Infisical's AWS Parameter Store sync assumes: it writes only under the stack's parameter folders.
  const sync = region.secretsSync;
  const syncRole =
    sync === undefined
      ? undefined
      : new aws.iam.Role(
          `${prefix}-secrets-sync`,
          {
            name: `${prefix}-secrets-sync`,
            assumeRolePolicy: JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Principal: { AWS: resolveRef(sync.principal) },
                  Action: "sts:AssumeRole",
                  Condition: { StringEquals: { "sts:ExternalId": resolveRef(sync.externalId) } },
                },
              ],
            }),
          },
          opts,
        );
  if (syncRole !== undefined)
    // oxlint-disable-next-line no-new -- reason: Pulumi registers a resource when it is constructed
    new aws.iam.RolePolicy(
      `${prefix}-secrets-sync`,
      {
        role: syncRole.id,
        policy: pulumi.jsonStringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "ssm:PutParameter",
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:DeleteParameter",
                "ssm:DeleteParameters",
                "ssm:AddTagsToResource",
                "ssm:RemoveTagsFromResource",
                "ssm:ListTagsForResource",
              ],
              Resource: plan.secretsSync.map((entry) => parameterArn(entry.destination)),
            },
            { Effect: "Allow", Action: "ssm:DescribeParameters", Resource: "*" },
          ],
        }),
      },
      opts,
    );

  const fileSystem = region.tools.some((tool) => tool.volume !== undefined && !onEbs(tool))
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

  const anyEbs = region.tools.some(onEbs);
  const gpuTypes = [...new Set(region.tools.flatMap((tool) => tool.gpu?.instanceType ?? []))];
  let instanceProfile: aws.iam.InstanceProfile | undefined;
  if (anyEbs || gpuTypes.length > 0) {
    const instanceRole = new aws.iam.Role(
      `${prefix}-instance`,
      { name: `${prefix}-instance`, assumeRolePolicy: assumedBy("ec2.amazonaws.com") },
      opts,
    );
    // oxlint-disable-next-line no-new -- reason: Pulumi registers a resource when it is constructed
    new aws.iam.RolePolicyAttachment(
      `${prefix}-instance`,
      { role: instanceRole.name, policyArn: INSTANCE_POLICY },
      opts,
    );
    instanceProfile = new aws.iam.InstanceProfile(
      `${prefix}-instance`,
      { name: `${prefix}-instance`, role: instanceRole.name },
      opts,
    );
  }
  // An EBS disk lives in one zone: each instance and its disk use the first subnet's.
  const zone = anyEbs
    ? aws.ec2.getSubnetOutput({ id: firstSubnet }, opts).availabilityZone
    : undefined;
  const ami = anyEbs
    ? aws.ssm.getParameterOutput({ name: ECS_AMI_PARAMETER }, opts).value
    : undefined;

  // One capacity provider per GPU instance type: an Auto Scaling group from zero that ECS grows when a GPU task
  // waits, one instance per GPU task (a g6.xlarge has one GPU). shortcut: managed termination protection is off, so
  // a scale-in may stop a running task; turn it on (and protect scale-in) when a GPU task must never be interrupted.
  const gpuAmi =
    gpuTypes.length === 0
      ? undefined
      : aws.ssm.getParameterOutput({ name: ECS_GPU_AMI_PARAMETER }, opts).value;
  const gpuProviders = new Map<string, aws.ecs.CapacityProvider>();
  for (const instanceType of gpuTypes) {
    const slug = instanceType.replaceAll(".", "-");
    const name = `${prefix}-gpu-${slug}`;
    const tasks = region.tools
      .filter((tool) => tool.gpu?.instanceType === instanceType)
      .reduce((total, tool) => total + tool.replicas, 0);
    const template = new aws.ec2.LaunchTemplate(
      name,
      {
        name,
        imageId: gpuAmi ?? "",
        instanceType,
        iamInstanceProfile: { name: instanceProfile?.name ?? "" },
        vpcSecurityGroupIds: securityGroups,
        metadataOptions: { httpTokens: "required" },
        blockDeviceMappings: [
          {
            deviceName: "/dev/xvda",
            ebs: { volumeSize: GPU_ROOT_DISK_GB, volumeType: "gp3", encrypted: "true" },
          },
        ],
        userData: cluster.name.apply((clusterName) =>
          Buffer.from(
            `#!/bin/bash\necho "ECS_CLUSTER=${clusterName}" >> /etc/ecs/ecs.config\n`,
          ).toString("base64"),
        ),
      },
      opts,
    );
    const group = new aws.autoscaling.Group(
      name,
      {
        name,
        minSize: 0,
        maxSize: tasks,
        vpcZoneIdentifiers: subnets,
        launchTemplate: { id: template.id, version: "$Latest" },
        tags: [{ key: "AmazonECSManaged", value: "true", propagateAtLaunch: true }],
      },
      opts,
    );
    gpuProviders.set(
      instanceType,
      new aws.ecs.CapacityProvider(
        name,
        {
          name,
          autoScalingGroupProvider: {
            autoScalingGroupArn: group.arn,
            managedScaling: { status: "ENABLED", targetCapacity: 100 },
            managedTerminationProtection: "DISABLED",
          },
        },
        opts,
      ),
    );
  }
  const clusterProviders =
    gpuProviders.size === 0
      ? undefined
      : new aws.ecs.ClusterCapacityProviders(
          prefix,
          {
            clusterName: cluster.name,
            capacityProviders: [...gpuProviders.values()].map((capacity) => capacity.name),
          },
          opts,
        );

  let cacheAddress: pulumi.Output<string> | undefined;
  if (region.cache !== undefined) {
    const subnetGroup = new aws.elasticache.SubnetGroup(
      `${prefix}-cache`,
      {
        name: `${prefix}-cache`,
        description: `Valkey of the ${regionKey} tools stack`,
        subnetIds: subnets,
      },
      opts,
    );
    const group = new aws.elasticache.ReplicationGroup(
      `${prefix}-cache`,
      {
        // shortcut: the id is cut to ElastiCache's 40 characters; a long project and environment may collide.
        replicationGroupId: `${prefix}-cache`.slice(0, 40),
        description: `Valkey of the ${regionKey} tools stack`,
        engine: "valkey",
        engineVersion: VALKEY_VERSION,
        nodeType: region.cache.nodeType,
        numCacheClusters: 1,
        subnetGroupName: subnetGroup.name,
        securityGroupIds: securityGroups,
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
      },
      opts,
    );
    cacheAddress = group.primaryEndpointAddress;
  }
  const cacheUrl =
    cacheAddress === undefined ? undefined : pulumi.interpolate`rediss://${cacheAddress}:6379`;

  const services: Record<string, pulumi.Output<string>> = {};
  for (const tool of region.tools) {
    // shortcut: one EFS directory per tool, world-writable at creation so any image user can own it.
    const accessPoint =
      fileSystem === undefined || tool.volume === undefined || onEbs(tool)
        ? undefined
        : new aws.efs.AccessPoint(
            tool.name,
            {
              fileSystemId: fileSystem.id,
              rootDirectory: {
                path: `/${tool.key}`,
                // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a POSIX file mode, not a permission key
                creationInfo: { ownerUid: 0, ownerGid: 0, permissions: "777" },
              },
            },
            opts,
          );

    let instance: aws.ec2.Instance | undefined;
    if (tool.ebs !== undefined && onEbs(tool) && instanceProfile !== undefined) {
      const disk = new aws.ebs.Volume(
        tool.name,
        {
          availabilityZone: zone ?? "",
          size: tool.ebs.diskGb,
          type: "gp3",
          encrypted: true,
          tags: { Name: tool.name },
        },
        { ...opts, retainOnDelete: true },
      );
      // Once attached, the disk appears as an NVMe device named after its volume id without the dash.
      const userData = pulumi.interpolate`#!/bin/bash
set -euo pipefail
DEVICE=/dev/disk/by-id/nvme-Amazon_Elastic_Block_Store_${disk.id.apply((id) => id.replace("-", ""))}
until [ -e "$DEVICE" ]; do sleep 5; done
blkid "$DEVICE" || mkfs -t xfs "$DEVICE"
mkdir -p ${EBS_MOUNT}
mount "$DEVICE" ${EBS_MOUNT}
echo "$DEVICE ${EBS_MOUNT} xfs defaults,nofail 0 2" >> /etc/fstab
mkdir -p ${EBS_MOUNT}/${tool.key}
chmod 777 ${EBS_MOUNT}/${tool.key}
echo "ECS_CLUSTER=${cluster.name}" >> /etc/ecs/ecs.config
echo 'ECS_INSTANCE_ATTRIBUTES={"${TOOL_ATTRIBUTE}":"${tool.key}"}' >> /etc/ecs/ecs.config
`;
      instance = new aws.ec2.Instance(
        tool.name,
        {
          ami: ami ?? "",
          instanceType: tool.ebs.instanceType,
          subnetId: firstSubnet,
          vpcSecurityGroupIds: securityGroups,
          iamInstanceProfile: instanceProfile.name,
          associatePublicIpAddress: false,
          metadataOptions: { httpTokens: "required" },
          rootBlockDevice: { encrypted: true, volumeType: "gp3" },
          userData,
          tags: { Name: tool.name },
        },
        opts,
      );
      // oxlint-disable-next-line no-new -- reason: Pulumi registers a resource when it is constructed
      new aws.ec2.VolumeAttachment(
        tool.name,
        { deviceName: "/dev/xvdf", volumeId: disk.id, instanceId: instance.id },
        opts,
      );
    }

    const container = {
      name: tool.key,
      image: tool.image,
      essential: true,
      command: tool.command,
      portMappings: tool.port === undefined ? [] : [{ containerPort: tool.port, protocol: "tcp" }],
      environment: [
        ...Object.entries(tool.environment).map(([name, value]) => ({ name, value })),
        ...(tool.cacheVariable === undefined || cacheUrl === undefined
          ? []
          : [{ name: tool.cacheVariable, value: cacheUrl }]),
      ],
      secrets: tool.secrets.map((secret) => ({ name: secret.name, valueFrom: secret.parameter })),
      ...(onGpu(tool) ? { resourceRequirements: [{ type: "GPU", value: "1" }] } : {}),
      mountPoints:
        tool.volume === undefined ? [] : [{ sourceVolume: "data", containerPath: tool.volume }],
      logConfiguration: logging(tool.key),
    };
    const efsVolumes =
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
          ];
    const task = new aws.ecs.TaskDefinition(
      tool.name,
      {
        family: tool.name,
        networkMode: "awsvpc",
        requiresCompatibilities: [instance === undefined && !onGpu(tool) ? "FARGATE" : "EC2"],
        cpu: String(tool.cpu),
        memory: String(tool.memoryMb),
        executionRoleArn: executionRole.arn,
        containerDefinitions: pulumi.jsonStringify([container]),
        volumes:
          instance === undefined
            ? efsVolumes
            : [{ name: "data", hostPath: `${EBS_MOUNT}/${tool.key}` }],
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

    const gpuProvider =
      tool.gpu === undefined ? undefined : gpuProviders.get(tool.gpu.instanceType);
    const service = new aws.ecs.Service(
      tool.name,
      {
        name: tool.name,
        cluster: cluster.arn,
        taskDefinition: task.arn,
        desiredCount: tool.replicas,
        ...(gpuProvider === undefined
          ? { launchType: instance === undefined ? "FARGATE" : "EC2" }
          : { capacityProviderStrategies: [{ capacityProvider: gpuProvider.name, weight: 1 }] }),
        // A public address is a Fargate-only setting; an EC2 task never gets one.
        networkConfiguration:
          instance === undefined && gpuProvider === undefined
            ? { subnets, securityGroups, assignPublicIp: false }
            : { subnets: gpuProvider === undefined ? [firstSubnet] : subnets, securityGroups },
        placementConstraints:
          instance === undefined
            ? undefined
            : [{ type: "memberOf", expression: `attribute:${TOOL_ATTRIBUTE} == ${tool.key}` }],
        serviceRegistries: registry === undefined ? undefined : { registryArn: registry.arn },
        deploymentCircuitBreaker: { enable: true, rollback: true },
      },
      {
        ...opts,
        dependsOn: [
          ...(instance === undefined ? mountTargets : [instance]),
          ...(gpuProvider === undefined || clusterProviders === undefined
            ? []
            : [clusterProviders]),
        ],
      },
    );
    services[tool.key] = service.id;
  }

  const databaseTask =
    region.databases.length === 0
      ? undefined
      : new aws.ecs.TaskDefinition(
          `${prefix}-databases`,
          {
            family: `${prefix}-databases`,
            networkMode: "awsvpc",
            requiresCompatibilities: ["FARGATE"],
            cpu: "256",
            memory: "512",
            executionRoleArn: executionRole.arn,
            containerDefinitions: pulumi.jsonStringify([
              {
                name: "databases",
                image: POSTGRES_CLIENT_IMAGE,
                essential: true,
                command: ["sh", "-c", databaseScript(region.databases)],
                environment: [{ name: "PGSSLMODE", value: "require" }],
                secrets: [
                  ...region.databaseAdmin.map((secret) => ({
                    name: secret.name,
                    valueFrom: secret.parameter,
                  })),
                  ...region.databases.map((database) => ({
                    name: databasePasswordVariable(database.name),
                    valueFrom: database.passwordParameter,
                  })),
                ],
                logConfiguration: logging("databases"),
              },
            ]),
          },
          opts,
        );

  return {
    cluster: cluster.arn,
    namespace: namespace.id,
    services,
    endpoints: region.tools.flatMap((tool) => (tool.endpoint === undefined ? [] : [tool.endpoint])),
    ...(cacheAddress === undefined ? {} : { cache: cacheAddress }),
    ...(databaseTask === undefined ? {} : { databaseTask: databaseTask.arn }),
    ...(syncRole === undefined ? {} : { secretsSyncRole: syncRole.arn }),
  };
}
