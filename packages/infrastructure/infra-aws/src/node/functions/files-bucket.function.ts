/**
 * Stackra file contract:
 * Purpose: `filesBucket(name, args, opts)`, the environment's files bucket that the `s3` file and media disks use: a
 *          private bucket on the environment's data key, the media CORS rule (a browser `PUT`s from the app origins
 *          with the `content-type` and `x-amz-meta-*` headers the signed upload carries), unclaimed `uploads/` expired
 *          after a day, replaced versions expired after the runway's days, and replication of every new object to the
 *          backup account's replica bucket in the same region, delete markers excluded.
 * Boundary: internal; the bucket's name reaches the services as `filesystem.s3.bucket` through the stack output and
 *           the runway, never typed here. Replication needs versioning and the backup account; the replication role
 *           has a fixed name the backup account's bucket and key trust by ARN. Serving `public/` through a CDN is not
 *           set up here: the bucket stays private.
 * Runtime: node
 * Governing contract: ADR 0222 (decisions 1 to 3: direct uploads, the bucket kinds), ADR 0186 (decision 3 as amended
 *                     2026-10-24: versioning and replication inside the region), ADR 0172 (decision 5: tags).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { policyOf } from "#node/functions/policy-of.function";
import { privateBucket } from "#node/functions/private-bucket.function";
import type { BackupTargets } from "#node/types/backup-targets.type";

/** The prefix a signed upload lands under until `MediaLibrary.claim` moves it (@stackra/media README). */
const UPLOADS = "uploads/";

/**
 * The files bucket.
 *
 * @param args.files - versioning, the noncurrent-version expiry and the upload origins.
 * @param args.replica - the backup account and its targets, or `null` for no replication.
 * @param args.replicationRole - the replication role's fixed name.
 */
export function filesBucket(
  name: string,
  args: {
    account: string;
    region: string;
    keyArn: pulumi.Output<string>;
    files: {
      versioning: boolean;
      expireNoncurrentDays: number | null;
      origins: readonly string[];
    };
    replica: { account: string; targets: BackupTargets } | null;
    replicationRole: string;
  },
  opts: pulumi.CustomResourceOptions,
): aws.s3.Bucket {
  const { files } = args;
  const { bucket, versioning } = privateBucket(
    name,
    {
      keyArn: args.keyArn,
      versioning: files.versioning,
      lifecycle: [
        {
          id: "unclaimed-uploads",
          status: "Enabled",
          filter: { prefix: UPLOADS },
          expiration: { days: 1 },
        },
        ...(files.expireNoncurrentDays === null
          ? []
          : [
              {
                id: "replaced-versions",
                status: "Enabled",
                filter: {},
                noncurrentVersionExpiration: { noncurrentDays: files.expireNoncurrentDays },
              },
            ]),
      ],
      statements: () => [],
    },
    opts,
  );

  if (files.origins.length > 0)
    new aws.s3.BucketCorsConfiguration(
      name,
      {
        bucket: bucket.id,
        corsRules: [
          {
            allowedMethods: ["PUT"],
            allowedOrigins: [...files.origins],
            allowedHeaders: ["content-type", "x-amz-meta-*"],
            maxAgeSeconds: 3600,
          },
        ],
      },
      opts,
    );

  if (args.replica !== null && versioning !== null) {
    const { account, targets } = args.replica;
    const role = new aws.iam.Role(
      `${name}-replication`,
      {
        name: args.replicationRole,
        assumeRolePolicy: policyOf([
          {
            Effect: "Allow",
            Principal: { Service: "s3.amazonaws.com" },
            Action: "sts:AssumeRole",
            Condition: {
              StringEquals: { "aws:SourceAccount": args.account },
              ArnLike: { "aws:SourceArn": bucket.arn },
            },
          },
        ]),
      },
      opts,
    );
    const permissions = new aws.iam.RolePolicy(
      `${name}-replication`,
      {
        role: role.id,
        policy: policyOf([
          {
            Effect: "Allow",
            Action: ["s3:GetReplicationConfiguration", "s3:ListBucket"],
            Resource: bucket.arn,
          },
          {
            Effect: "Allow",
            Action: [
              "s3:GetObjectVersionForReplication",
              "s3:GetObjectVersionAcl",
              "s3:GetObjectVersionTagging",
            ],
            Resource: pulumi.interpolate`${bucket.arn}/*`,
          },
          {
            Effect: "Allow",
            Action: [
              "s3:ReplicateObject",
              "s3:ReplicateTags",
              "s3:ObjectOwnerOverrideToBucketOwner",
            ],
            Resource: `${targets.bucketArn}/*`,
          },
          { Effect: "Allow", Action: "kms:Decrypt", Resource: args.keyArn },
          {
            // The replica key is known by its alias only; IAM matches a key, so the alias is a condition.
            Effect: "Allow",
            Action: ["kms:Encrypt", "kms:GenerateDataKey"],
            Resource: `arn:aws:kms:${args.region}:${account}:key/*`,
            Condition: { "ForAnyValue:StringEquals": { "kms:ResourceAliases": targets.keyAlias } },
          },
        ]),
      },
      opts,
    );
    new aws.s3.BucketReplicationConfig(
      name,
      {
        bucket: bucket.id,
        role: role.arn,
        rules: [
          {
            id: "backup-account",
            status: "Enabled",
            filter: {},
            deleteMarkerReplication: { status: "Disabled" },
            sourceSelectionCriteria: { sseKmsEncryptedObjects: { status: "Enabled" } },
            destination: {
              bucket: targets.bucketArn,
              account,
              storageClass: "STANDARD",
              accessControlTranslation: { owner: "Destination" },
              encryptionConfiguration: { replicaKmsKeyId: targets.keyAliasArn },
            },
          },
        ],
      },
      { ...opts, dependsOn: [versioning, permissions] },
    );
  }
  return bucket;
}
