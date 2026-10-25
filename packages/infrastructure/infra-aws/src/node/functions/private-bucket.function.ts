/**
 * Stackra file contract:
 * Purpose: `privateBucket(name, args, opts)`, an S3 bucket nobody reaches without credentials: every public access
 *          setting blocked, default encryption with a customer-managed KMS key (S3 bucket keys on), optional
 *          versioning and lifecycle rules, and a bucket policy that refuses plain HTTP plus the statements the caller
 *          adds.
 * Boundary: internal; the shape the files, state and replica buckets share. The policy waits for the public access
 *           block, which S3 applies first.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 4: state in S3 with KMS), ADR 0186 (decision 3: versioning), ADR 0222
 *                     (media buckets).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { policyOf } from "#node/functions/policy-of.function";

/**
 * The bucket and its versioning (a replication must wait for it), or `null` when versioning is off.
 *
 * @param args.bucket - a fixed bucket name; Pulumi names it from `name` when omitted.
 * @param args.statements - more policy statements, given the bucket's ARN.
 */
export function privateBucket(
  name: string,
  args: {
    bucket?: string;
    keyArn: pulumi.Input<string>;
    versioning: boolean;
    lifecycle: aws.types.input.s3.BucketLifecycleConfigurationRule[];
    statements: (arn: pulumi.Output<string>) => object[];
  },
  opts: pulumi.CustomResourceOptions,
): { bucket: aws.s3.Bucket; versioning: aws.s3.BucketVersioning | null } {
  const bucket = new aws.s3.Bucket(
    name,
    args.bucket === undefined ? {} : { bucket: args.bucket },
    opts,
  );
  const versioning = args.versioning
    ? new aws.s3.BucketVersioning(
        name,
        { bucket: bucket.id, versioningConfiguration: { status: "Enabled" } },
        opts,
      )
    : null;
  new aws.s3.BucketServerSideEncryptionConfiguration(
    name,
    {
      bucket: bucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: args.keyArn,
          },
          bucketKeyEnabled: true,
        },
      ],
    },
    opts,
  );
  const block = new aws.s3.BucketPublicAccessBlock(
    name,
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    opts,
  );
  if (args.lifecycle.length > 0)
    new aws.s3.BucketLifecycleConfiguration(
      name,
      { bucket: bucket.id, rules: args.lifecycle },
      { ...opts, dependsOn: versioning === null ? [] : [versioning] },
    );
  new aws.s3.BucketPolicy(
    name,
    {
      bucket: bucket.id,
      policy: policyOf([
        {
          Sid: "DenyPlainHttp",
          Effect: "Deny",
          Principal: "*",
          Action: "s3:*",
          Resource: [bucket.arn, pulumi.interpolate`${bucket.arn}/*`],
          Condition: { Bool: { "aws:SecureTransport": "false" } },
        },
        ...args.statements(bucket.arn),
      ]),
    },
    { ...opts, dependsOn: [block] },
  );
  return { bucket, versioning };
}
