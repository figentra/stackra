/**
 * Stackra file contract:
 * Purpose: `DeployEvidence`, what one deploy job declares for the approvals bot (ADR 0533): the commit, the target and
 *          member, whether it rolls out gradually with automatic rollback, and whether it carries a destructive
 *          migration. `runway.evidence/v1`, the contract agreed with figentra/infra's classifier (infra#57).
 * Boundary: data only. `null` means unknown, which the bot treats as the owner's (floor).
 * Runtime: isomorphic
 * Governing contract: ADR 0533 (decision 3); ADR 0352 (decision 6: the logic is the CLI's, the workflow only calls it).
 */

/** One deploy job's evidence. */
export type DeployEvidence = {
  /** The contract version the bot reads. */
  readonly schema: "runway.evidence/v1";

  /** `figentra/<repo>`; the bot ignores evidence of another repository. */
  readonly repo: string;

  /** The runway environment the job deploys. */
  readonly environment: string;

  /** The full commit deployed; the bot ignores evidence whose sha is not the deployment's. */
  readonly sha: string;

  /** The destination target (`cloudflare-workers`, `encore-cloud`, `eas`). */
  readonly target: string;

  /** The member the job ships, or `null` for the whole target. */
  readonly member: string | null;

  /** Whether this target and member roll out gradually with automatic rollback; `null` when unknown. */
  readonly rollout: boolean | null;

  /** How the target ships, for the owner's reasons; the bot decides on `rollout` only. */
  readonly rolloutDetail: {
    /** `staged` for a Workers member with traffic steps, else `all-at-once`; `null` when unknown. */
    readonly kind: "staged" | "all-at-once" | null;
    readonly healthGate: boolean | null;
    readonly autoRollback: boolean | null;
    /** The production traffic steps of a Workers member (`[10, 50, 100]`); `null` off Workers. */
    readonly steps: readonly number[] | null;
    /** Why `rollout` is not `true`, or `null` when it is. */
    readonly floorReason:
      | "durable-object-migrations"
      | "single-step"
      | "no-rollout-primitive"
      | "undeclared"
      | null;
  };

  /** Whether the deploy carries a destructive migration; `null` until gen classifies migrations. */
  readonly destructive: boolean | null;

  /** The destructive migrations by id (`<module>.<NNNN>_<stem>`), empty while `destructive` is not `true`. */
  readonly destructiveMigrations: readonly string[];
};
