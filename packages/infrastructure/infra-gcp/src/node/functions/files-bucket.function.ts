/**
 * Stackra file contract:
 * Purpose: `filesBucket(name, args, opts)`, the environment's files bucket that the `s3` file and media disks reach
 *          through GCS's S3-compatible endpoint: a private bucket (uniform access, public access prevention enforced)
 *          in the environment's region on the environment's data key, the media CORS rule (a browser `PUT`s from the
 *          app origins with the `content-type` and `x-amz-meta-*` headers the signed upload carries), unclaimed
 *          `uploads/` deleted after a day and replaced versions deleted after the runway's days.
 * Boundary: internal; GCS refuses plain HTTP itself, so no policy does. The storage service agent of the project gets
 *           encrypt/decrypt on the data key before the bucket exists, as GCS checks it at creation. The bucket's name
 *           reaches the services as `filesystem.s3.bucket` through the stack output; the HMAC key the `s3` disk signs
 *           with is a secret and is created by the owner, never here. No copy leaves the project (see the README).
 * Runtime: node
 * Governing contract: ADR 0222 (decisions 1 to 3: direct uploads), ADR 0186 (decision 3: versioning), ADR 0354
 *                     (decision 3), ADR 0172 (decision 5: labels).
 */
import * as gcp from "@pulumi/gcp";
import type * as pulumi from "@pulumi/pulumi";

/** The prefix a signed upload lands under until `MediaLibrary.claim` moves it (@stackra/media README). */
const UPLOADS = "uploads/";

/**
 * The files bucket.
 *
 * @param args.projectNumber - names the project's storage service agent.
 * @param args.keyId - the data key's resource id.
 * @param args.files - versioning, the noncurrent-version expiry and the upload origins.
 */
export function filesBucket(
  name: string,
  args: {
    project: string;
    projectNumber: string;
    region: string;
    keyId: pulumi.Output<string>;
    files: {
      versioning: boolean;
      expireNoncurrentDays: number | null;
      origins: readonly string[];
    };
  },
  opts: pulumi.CustomResourceOptions,
): gcp.storage.Bucket {
  const { files } = args;
  const agent = new gcp.kms.CryptoKeyIAMMember(
    `${name}-agent`,
    {
      cryptoKeyId: args.keyId,
      role: "roles/cloudkms.cryptoKeyEncrypterDecrypter",
      member: `serviceAccount:service-${args.projectNumber}@gs-project-accounts.iam.gserviceaccount.com`,
    },
    opts,
  );
  return new gcp.storage.Bucket(
    name,
    {
      project: args.project,
      location: args.region,
      uniformBucketLevelAccess: true,
      publicAccessPrevention: "enforced",
      versioning: { enabled: files.versioning },
      encryption: { defaultKmsKeyName: args.keyId },
      cors:
        files.origins.length === 0
          ? []
          : [
              {
                methods: ["PUT"],
                origins: [...files.origins],
                responseHeaders: ["content-type", "x-amz-meta-*"],
                maxAgeSeconds: 3600,
              },
            ],
      lifecycleRules: [
        { action: { type: "Delete" }, condition: { age: 1, matchesPrefixes: [UPLOADS] } },
        ...(files.expireNoncurrentDays === null
          ? []
          : [
              {
                action: { type: "Delete" },
                condition: {
                  daysSinceNoncurrentTime: files.expireNoncurrentDays,
                  withState: "ARCHIVED",
                },
              },
            ]),
      ],
    },
    { ...opts, dependsOn: [agent] },
  );
}
