/**
 * Stackra file contract:
 * Purpose: `BucketPlan`, one S3 bucket of a runtime plan: a bucket a service member sizes under
 *          `environments.<env>.buckets` of its runway, with its AWS name, versioning and the expiry of noncurrent
 *          versions, both from the root's `shared.buckets` defaults.
 * Boundary: type only; data, no Pulumi type. Public access is always blocked, so it is not a field.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1 and 2), ADR 0186 (decision 3: object storage is versioned), ADR 0172.
 */

/** One bucket. */
export type BucketPlan = {
  /** `<member>.<bucket>`, the key of the program's outputs (`commerce.product_images`). */
  readonly key: string;
  /** The globally unique S3 name, 63 characters at most (`acme-platform-staging-commerce-product-images`). */
  readonly name: string;
  /** Object versioning; on unless the root's `shared.buckets.versioning` is `false`. */
  readonly versioning: boolean;
  /** Days before a noncurrent version expires (`shared.buckets.lifecycle.expireNoncurrentDays`); only with versioning. */
  readonly expireNoncurrentDays?: number | undefined;
  /** `env`, `service` and, when the topology places the member, `group`. */
  readonly tags: Readonly<Record<string, string>>;
};
