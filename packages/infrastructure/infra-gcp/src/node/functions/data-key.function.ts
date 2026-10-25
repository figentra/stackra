/**
 * Stackra file contract:
 * Purpose: `dataKey(name, args, opts)`, the environment's customer-managed Cloud KMS key: a key ring in the
 *          environment's region and an encrypt/decrypt key in it that rotates yearly and, once destroyed, waits 30 days
 *          before its material is gone.
 * Boundary: internal; the GCP twin of infra-aws's data key. A key ring and a key cannot be deleted in GCP, only their
 *           versions destroyed, so their names are fixed by the project and environment and never reused for anything
 *           else. Who may use the key is granted by the resource that needs it (`filesBucket` grants the storage
 *           service agent), so the key itself carries no member.
 * Runtime: node
 * Governing contract: ADR 0354 (decision 3), ADR 0171 (decision 4: data encrypted with a managed key), ADR 0186.
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as gcp from "@pulumi/gcp";
import type * as pulumi from "@pulumi/pulumi";

/** A year, as Cloud KMS spells a duration. */
const YEARLY = "31536000s";

/** Thirty days, the wait between a version's destruction and its material being gone. */
const DESTROY_AFTER = "2592000s";

/**
 * The key.
 *
 * @param args.ring - the key ring's name, unique in the project and region for good.
 */
export function dataKey(
  name: string,
  args: { project: string; region: string; ring: string },
  opts: pulumi.CustomResourceOptions,
): gcp.kms.CryptoKey {
  const ring = new gcp.kms.KeyRing(
    name,
    { name: args.ring, project: args.project, location: args.region },
    opts,
  );
  return new gcp.kms.CryptoKey(
    name,
    {
      name: "data",
      keyRing: ring.id,
      purpose: "ENCRYPT_DECRYPT",
      rotationPeriod: YEARLY,
      destroyScheduledDuration: DESTROY_AFTER,
    },
    opts,
  );
}
