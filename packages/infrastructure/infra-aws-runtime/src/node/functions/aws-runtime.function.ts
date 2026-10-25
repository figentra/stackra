/**
 * Stackra file contract:
 * Purpose: `awsRuntime(plan, options)`, the Pulumi program part that declares one environment's runtime resources
 *          from a `RuntimePlan`: each SQS queue (SSE-SQS, the member's visibility timeout, a 14-day dead-letter queue
 *          after five receives), the SNS topic of a topic-fed queue (SSE with the AWS-managed key) with its raw
 *          subscription and the queue policy that admits only that topic, each Valkey replication group (TLS and
 *          at-rest encryption, its own parameter group for an eviction policy, one subnet group for all) and each S3
 *          bucket (public access blocked, versioning and the noncurrent-version expiry the plan asks for).
 * Boundary: declares resources only, inside the Pulumi program that calls it; `pulumi preview` shows them and only the
 *           owner applies them (agents never run `pulumi up`). No secret is created or read: caches are reached
 *           over TLS inside the given security groups.
 * Runtime: node
 * Governing contract: ADR 0171 (decisions 2, 3 and 5), ADR 0296 (decisions 1 and 2), ADR 0186 (decision 3),
 *                     ADR 0172 (decision 5), ADR 0173 (no secret values).
 */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { resourceName } from "#core/functions/resource-name.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import type { AwsRuntime } from "#node/types/aws-runtime.type";
import type { AwsRuntimeOptions } from "#node/types/aws-runtime-options.type";

/** Receives before SQS moves a message to the dead-letter queue. */
const MAX_RECEIVES = 5;

/** Fourteen days, the longest SQS retention, so a dead letter waits for whoever replays it. */
const DEAD_LETTER_RETENTION_SECONDS = 1_209_600;

/** The Valkey engine version and its parameter group family. */
const VALKEY_VERSION = "8.0";
const VALKEY_FAMILY = "valkey8";

/** The longest ElastiCache subnet group name. */
const SUBNET_GROUP_NAME_LIMIT = 255;

/**
 * Declares the resources of `plan` and returns their identifiers.
 *
 * @param plan - one environment's plan, from `runtimePlan` or `readRuntimePlan`.
 * @param options - the cache network and the extra tags.
 * @example
 * // .stackra/infra/index.ts (generated)
 * const runtime = awsRuntime(readRuntimePlan(repositoryRoot, "staging"), { network });
 * export const queues = runtime.queues;
 */
export function awsRuntime(plan: RuntimePlan, options: AwsRuntimeOptions): AwsRuntime {
  const queues: Record<string, { url: pulumi.Output<string>; arn: pulumi.Output<string> }> = {};
  const topics: Record<string, pulumi.Output<string>> = {};
  const caches: Record<string, pulumi.Output<string>> = {};
  const buckets: Record<string, pulumi.Output<string>> = {};

  for (const queue of plan.queues) {
    const tags = { ...options.tags, ...queue.tags };
    const deadLetter =
      queue.deadLetterName === undefined
        ? undefined
        : new aws.sqs.Queue(queue.deadLetterName, {
            name: queue.deadLetterName,
            messageRetentionSeconds: DEAD_LETTER_RETENTION_SECONDS,
            sqsManagedSseEnabled: true,
            tags,
          });
    const sqsQueue = new aws.sqs.Queue(queue.name, {
      name: queue.name,
      visibilityTimeoutSeconds: queue.visibilityTimeoutSeconds,
      sqsManagedSseEnabled: true,
      redrivePolicy:
        deadLetter === undefined
          ? undefined
          : pulumi.jsonStringify({
              deadLetterTargetArn: deadLetter.arn,
              maxReceiveCount: MAX_RECEIVES,
            }),
      tags,
    });
    queues[queue.key] = { url: sqsQueue.url, arn: sqsQueue.arn };

    if (queue.topic) {
      const topic = new aws.sns.Topic(queue.name, {
        name: queue.name,
        kmsMasterKeyId: "alias/aws/sns",
        tags,
      });
      // The source-ARN condition keeps any other topic or account from writing to the queue (confused deputy).
      const policy = new aws.sqs.QueuePolicy(queue.name, {
        queueUrl: sqsQueue.url,
        policy: pulumi.jsonStringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { Service: "sns.amazonaws.com" },
              Action: "sqs:SendMessage",
              Resource: sqsQueue.arn,
              Condition: { ArnEquals: { "aws:SourceArn": topic.arn } },
            },
          ],
        }),
      });
      // oxlint-disable-next-line no-new -- reason: Pulumi registers a resource when it is constructed
      new aws.sns.TopicSubscription(
        queue.name,
        { topic: topic.arn, protocol: "sqs", endpoint: sqsQueue.arn, rawMessageDelivery: true },
        { dependsOn: [policy] },
      );
      topics[queue.key] = topic.arn;
    }
  }

  if (plan.caches.length > 0) {
    const subnetGroupName = resourceName(
      [plan.project, plan.environment, "cache"],
      SUBNET_GROUP_NAME_LIMIT,
    );
    const subnetGroup = new aws.elasticache.SubnetGroup(subnetGroupName, {
      name: subnetGroupName,
      description: `Valkey caches of ${plan.project} ${plan.environment}`,
      subnetIds: options.network.subnetIds,
      tags: { ...options.tags, env: plan.environment, service: "shared" },
    });
    for (const cache of plan.caches) {
      const tags = { ...options.tags, ...cache.tags };
      const parameterGroup =
        cache.eviction === undefined
          ? undefined
          : new aws.elasticache.ParameterGroup(cache.name, {
              name: cache.name,
              family: VALKEY_FAMILY,
              description: `${cache.key}: maxmemory-policy ${cache.eviction}`,
              parameters: [{ name: "maxmemory-policy", value: cache.eviction }],
              tags,
            });
      const group = new aws.elasticache.ReplicationGroup(cache.name, {
        replicationGroupId: cache.name,
        description: `Valkey cache ${cache.key} of ${plan.project} ${plan.environment}`,
        engine: "valkey",
        engineVersion: VALKEY_VERSION,
        nodeType: cache.nodeType,
        numCacheClusters: cache.replicas + 1,
        automaticFailoverEnabled: cache.replicas > 0,
        multiAzEnabled: cache.replicas > 0,
        parameterGroupName: parameterGroup?.name,
        port: 6379,
        subnetGroupName: subnetGroup.name,
        securityGroupIds: options.network.securityGroupIds,
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        tags,
      });
      caches[cache.key] = group.primaryEndpointAddress;
    }
  }

  for (const bucket of plan.buckets) {
    const s3Bucket = new aws.s3.Bucket(bucket.name, {
      bucket: bucket.name,
      tags: { ...options.tags, ...bucket.tags },
    });
    // oxlint-disable-next-line no-new -- reason: Pulumi registers a resource when it is constructed
    new aws.s3.BucketPublicAccessBlock(bucket.name, {
      bucket: s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
    if (bucket.versioning) {
      const versioning = new aws.s3.BucketVersioning(bucket.name, {
        bucket: s3Bucket.id,
        versioningConfiguration: { status: "Enabled" },
      });
      if (bucket.expireNoncurrentDays !== undefined) {
        // oxlint-disable-next-line no-new -- reason: Pulumi registers a resource when it is constructed
        new aws.s3.BucketLifecycleConfiguration(
          bucket.name,
          {
            bucket: s3Bucket.id,
            rules: [
              {
                id: "expire-noncurrent-versions",
                status: "Enabled",
                filter: {},
                noncurrentVersionExpiration: { noncurrentDays: bucket.expireNoncurrentDays },
              },
            ],
          },
          { dependsOn: [versioning] },
        );
      }
    }
    buckets[bucket.key] = s3Bucket.bucket;
  }

  return { queues, topics, caches, buckets };
}
