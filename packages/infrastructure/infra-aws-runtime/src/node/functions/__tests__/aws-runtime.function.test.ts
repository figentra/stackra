/**
 * Stackra file contract:
 * Purpose: unit tests of `awsRuntime` under Pulumi's mocks: a topic-fed queue gets its dead-letter queue and redrive
 *          policy, its encrypted topic, the raw subscription and a queue policy limited to that topic; a queue without
 *          a dead-letter queue gets no redrive; the caches share one subnet group, a dedicated cache gets its own
 *          eviction parameter group, and both run encrypted; a bucket blocks public access, is versioned and expires
 *          noncurrent versions; every resource carries the extra tags under the plan's; the returned outputs resolve
 *          to the mocked identifiers.
 * Boundary: test only; no cloud is called and no state is written (`pulumi.runtime.setMocks`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decisions 2 and 3); ADR 0186 (decision 3).
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { awsRuntime } from "#node/functions/aws-runtime.function";
import type { AwsRuntime } from "#node/types/aws-runtime.type";

/** One resource the program registered: its type token, logical name and resolved inputs. */
type Registered = {
  readonly type: string;
  readonly name: string;
  readonly inputs: Record<string, unknown>;
};

const registered: Registered[] = [];

const STAGING = { env: "staging", service: "commerce", group: "core" };

const PLAN: RuntimePlan = {
  project: "acme-platform",
  environment: "staging",
  queues: [
    {
      key: "commerce.default",
      name: "acme-platform-staging-commerce-default",
      deadLetterName: "acme-platform-staging-commerce-default-dlq",
      visibilityTimeoutSeconds: 300,
      topic: true,
      tags: STAGING,
    },
    {
      key: "commerce.maintenance",
      name: "acme-platform-staging-commerce-maintenance",
      topic: false,
      tags: STAGING,
    },
  ],
  caches: [
    {
      key: "shared",
      name: "acme-platform-staging-cache",
      nodeType: "cache.t4g.small",
      replicas: 0,
      tags: { env: "staging", service: "shared" },
    },
    {
      key: "commerce.cache",
      name: "acme-platform-staging-commerce-cache",
      nodeType: "cache.t4g.micro",
      replicas: 1,
      eviction: "volatile-ttl",
      tags: STAGING,
    },
  ],
  buckets: [
    {
      key: "commerce.product_images",
      name: "acme-platform-staging-commerce-product-images",
      versioning: true,
      expireNoncurrentDays: 30,
      tags: STAGING,
    },
  ],
};

let runtime: AwsRuntime;

/** The value `output` resolves to; fails when the program returned no output under that key. */
function valueOf<T>(output: pulumi.Output<T> | undefined): Promise<T> {
  if (output === undefined) throw new Error("The program returned no output under that key");
  return new Promise((resolve) => {
    output.apply(resolve);
  });
}

/** The registered resource whose type token ends in `:<kind>` and whose logical name is `name`. */
function resource(kind: string, name: string): Registered {
  const found = registered.find((entry) => entry.type.endsWith(`:${kind}`) && entry.name === name);
  if (found === undefined) throw new Error(`No ${kind} named ${name} was registered`);
  return found;
}

beforeAll(async () => {
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => {
        const inputs = args.inputs as Record<string, unknown>;
        registered.push({ type: args.type, name: args.name, inputs });
        return {
          id: `${args.name}-id`,
          state: {
            ...inputs,
            arn: `arn:mock:${args.type.split(":").at(-1)}:${args.name}`,
            url: `https://sqs.mock/${args.name}`,
            primaryEndpointAddress: `${args.name}.cache.mock`,
          },
        };
      },
      call: (args) => args.inputs as Record<string, unknown>,
    },
    "infra-aws-runtime",
    "staging",
    false,
  );
  runtime = awsRuntime(PLAN, {
    network: { subnetIds: ["subnet-a", "subnet-b"], securityGroupIds: ["sg-runtime"] },
    tags: { owner: "platform", service: "overridden" },
  });
  await Promise.all([
    valueOf(runtime.buckets["commerce.product_images"]),
    valueOf(runtime.caches["commerce.cache"]),
    valueOf(runtime.topics["commerce.default"]),
  ]);
  // Registration is asynchronous: wait until no resource has arrived for a while.
  let count = -1;
  while (count !== registered.length) {
    count = registered.length;
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
});

describe("awsRuntime", () => {
  it("declares a topic-fed queue with its dead-letter queue, subscription and policy", () => {
    const deadLetter = resource("Queue", "acme-platform-staging-commerce-default-dlq");
    const queue = resource("Queue", "acme-platform-staging-commerce-default");
    const topic = resource("Topic", "acme-platform-staging-commerce-default");
    const subscription = resource("TopicSubscription", "acme-platform-staging-commerce-default");
    const policy = resource("QueuePolicy", "acme-platform-staging-commerce-default");

    expect(deadLetter.inputs).toMatchObject({
      messageRetentionSeconds: 1_209_600,
      sqsManagedSseEnabled: true,
    });
    expect(queue.inputs).toMatchObject({
      name: "acme-platform-staging-commerce-default",
      visibilityTimeoutSeconds: 300,
      sqsManagedSseEnabled: true,
    });
    expect(JSON.parse(queue.inputs["redrivePolicy"] as string)).toEqual({
      deadLetterTargetArn: "arn:mock:Queue:acme-platform-staging-commerce-default-dlq",
      maxReceiveCount: 5,
    });
    expect(topic.inputs).toMatchObject({ kmsMasterKeyId: "alias/aws/sns" });
    expect(subscription.inputs).toMatchObject({
      topic: "arn:mock:Topic:acme-platform-staging-commerce-default",
      protocol: "sqs",
      endpoint: "arn:mock:Queue:acme-platform-staging-commerce-default",
      rawMessageDelivery: true,
    });
    const statement = JSON.parse(policy.inputs["policy"] as string).Statement[0];
    expect(statement).toMatchObject({
      Effect: "Allow",
      Principal: { Service: "sns.amazonaws.com" },
      Action: "sqs:SendMessage",
      Resource: "arn:mock:Queue:acme-platform-staging-commerce-default",
      Condition: {
        ArnEquals: { "aws:SourceArn": "arn:mock:Topic:acme-platform-staging-commerce-default" },
      },
    });
  });

  it("declares a plain queue without redrive or topic", () => {
    const queue = resource("Queue", "acme-platform-staging-commerce-maintenance");

    expect(queue.inputs["redrivePolicy"]).toBeUndefined();
    expect(
      registered.some((entry) => entry.name === "acme-platform-staging-commerce-maintenance-dlq"),
    ).toBe(false);
    expect(
      registered.some(
        (entry) =>
          entry.type.endsWith(":Topic") &&
          entry.name === "acme-platform-staging-commerce-maintenance",
      ),
    ).toBe(false);
    expect(runtime.topics["commerce.maintenance"]).toBeUndefined();
  });

  it("declares encrypted Valkey caches in one subnet group, with the dedicated eviction policy", () => {
    const subnetGroup = resource("SubnetGroup", "acme-platform-staging-cache");
    const shared = resource("ReplicationGroup", "acme-platform-staging-cache");
    const dedicated = resource("ReplicationGroup", "acme-platform-staging-commerce-cache");
    const parameters = resource("ParameterGroup", "acme-platform-staging-commerce-cache");

    expect(subnetGroup.inputs).toMatchObject({ subnetIds: ["subnet-a", "subnet-b"] });
    expect(shared.inputs).toMatchObject({
      replicationGroupId: "acme-platform-staging-cache",
      engine: "valkey",
      nodeType: "cache.t4g.small",
      numCacheClusters: 1,
      automaticFailoverEnabled: false,
      subnetGroupName: "acme-platform-staging-cache",
      securityGroupIds: ["sg-runtime"],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
    });
    expect(shared.inputs["parameterGroupName"]).toBeUndefined();
    expect(dedicated.inputs).toMatchObject({
      nodeType: "cache.t4g.micro",
      numCacheClusters: 2,
      automaticFailoverEnabled: true,
      multiAzEnabled: true,
      parameterGroupName: "acme-platform-staging-commerce-cache",
    });
    expect(parameters.inputs).toMatchObject({
      family: "valkey8",
      parameters: [{ name: "maxmemory-policy", value: "volatile-ttl" }],
    });
    expect(registered.filter((entry) => entry.type.endsWith(":SubnetGroup"))).toHaveLength(1);
  });

  it("declares a private, versioned bucket that expires noncurrent versions", () => {
    const name = "acme-platform-staging-commerce-product-images";

    expect(resource("Bucket", name).inputs).toMatchObject({ bucket: name });
    expect(resource("BucketPublicAccessBlock", name).inputs).toMatchObject({
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
    expect(resource("BucketVersioning", name).inputs).toMatchObject({
      versioningConfiguration: { status: "Enabled" },
    });
    expect(resource("BucketLifecycleConfiguration", name).inputs).toMatchObject({
      rules: [{ status: "Enabled", noncurrentVersionExpiration: { noncurrentDays: 30 } }],
    });
  });

  it("tags every resource with the extra tags under the plan's", () => {
    expect(resource("Queue", "acme-platform-staging-commerce-default").inputs["tags"]).toEqual({
      owner: "platform",
      ...STAGING,
    });
    expect(resource("ReplicationGroup", "acme-platform-staging-cache").inputs["tags"]).toEqual({
      owner: "platform",
      env: "staging",
      service: "shared",
    });
  });

  it("returns the identifiers by plan key", async () => {
    expect(await valueOf(runtime.queues["commerce.default"]?.url)).toBe(
      "https://sqs.mock/acme-platform-staging-commerce-default",
    );
    expect(await valueOf(runtime.topics["commerce.default"])).toBe(
      "arn:mock:Topic:acme-platform-staging-commerce-default",
    );
    expect(await valueOf(runtime.caches["shared"])).toBe("acme-platform-staging-cache.cache.mock");
    expect(await valueOf(runtime.buckets["commerce.product_images"])).toBe(
      "acme-platform-staging-commerce-product-images",
    );
  });
});
