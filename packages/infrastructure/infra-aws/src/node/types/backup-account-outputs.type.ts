/**
 * Stackra file contract:
 * Purpose: `BackupAccountOutputs`, what the backup account's stack exports: the vault snapshot copies land in, the
 *          replica bucket the files replicate to, their key and the topic the vault's failures are alerted on.
 * Boundary: type only; the environment stacks reach these by their fixed names, not through these outputs.
 * Runtime: node
 * Governing contract: ADR 0186 (decisions 2 and 3).
 */
import type * as pulumi from "@pulumi/pulumi";

/** The backup account's targets. */
export type BackupAccountOutputs = {
  /** The vault snapshot copies land in. */
  readonly vaultArn: pulumi.Output<string>;
  /** The replica bucket's name. */
  readonly replicaBucket: pulumi.Output<string>;
  /** The key the vault and the replica bucket are encrypted with. */
  readonly kmsKeyArn: pulumi.Output<string>;
  /** The topic a failed job of the vault is published to; the alerting channel subscribes to it. */
  readonly alertTopicArn: pulumi.Output<string>;
};
