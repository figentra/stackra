/**
 * Stackra file contract:
 * Purpose: `logArchive(name, months)`, the cold log archive (ADR 0184 decision 5): a private S3 bucket (every public
 *          access setting blocked, SSE-S3 encryption, plain HTTP refused) whose objects expire after `months` calendar
 *          months, and the one IAM user, with its access key, that Better Stack writes it with: list, read, write and
 *          delete in that bucket and nothing else.
 * Boundary: internal; `logPipeline` hands the bucket and key to the Better Stack source. The key's secret stays in the
 *           encrypted Pulumi state and Better Stack.
 * Runtime: node
 * Governing contract: ADR 0184 (decision 5: 13 months in S3), ADR 0171 (decisions 4 and 6), ADR 0173.
 */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

/** The average calendar month in days; rounding up keeps every log for the full months. */
const DAYS_PER_MONTH = 365.25 / 12;

/**
 * The archive bucket, its settings, and the writer's user, policy and access key.
 *
 * @param name - the Pulumi name of every resource; the bucket name is derived from it with a random suffix.
 * @param months - the calendar months an object is kept.
 * @example
 * const { bucket, accessKey } = logArchive("logs-archive-acme-platform", 13); // objects expire after 396 days
 */
export function logArchive(
  name: string,
  months: number,
): {
  bucket: aws.s3.Bucket;
  publicAccessBlock: aws.s3.BucketPublicAccessBlock;
  encryption: aws.s3.BucketServerSideEncryptionConfiguration;
  lifecycle: aws.s3.BucketLifecycleConfiguration;
  policy: aws.s3.BucketPolicy;
  user: aws.iam.User;
  userPolicy: aws.iam.UserPolicy;
  accessKey: aws.iam.AccessKey;
} {
  const bucket = new aws.s3.Bucket(name, {});
  const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(name, {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  });
  const encryption = new aws.s3.BucketServerSideEncryptionConfiguration(name, {
    bucket: bucket.id,
    rules: [{ applyServerSideEncryptionByDefault: { sseAlgorithm: "AES256" } }],
  });
  const lifecycle = new aws.s3.BucketLifecycleConfiguration(name, {
    bucket: bucket.id,
    rules: [
      {
        id: `expire-after-${months}-months`,
        status: "Enabled",
        filter: {},
        expiration: { days: Math.ceil(months * DAYS_PER_MONTH) },
      },
    ],
  });
  const policy = new aws.s3.BucketPolicy(
    name,
    {
      bucket: bucket.id,
      policy: pulumi.jsonStringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "DenyPlainHttp",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:*",
            Resource: [bucket.arn, pulumi.interpolate`${bucket.arn}/*`],
            Condition: { Bool: { "aws:SecureTransport": "false" } },
          },
        ],
      }),
    },
    // S3 refuses a policy while the public access block is being applied.
    { dependsOn: [publicAccessBlock] },
  );
  const user = new aws.iam.User(name, {});
  const userPolicy = new aws.iam.UserPolicy(name, {
    user: user.name,
    policy: pulumi.jsonStringify({
      Version: "2012-10-17",
      Statement: [
        { Effect: "Allow", Action: "s3:ListBucket", Resource: bucket.arn },
        {
          Effect: "Allow",
          Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
          Resource: pulumi.interpolate`${bucket.arn}/*`,
        },
      ],
    }),
  });
  const accessKey = new aws.iam.AccessKey(name, { user: user.name });
  return { bucket, publicAccessBlock, encryption, lifecycle, policy, user, userPolicy, accessKey };
}
