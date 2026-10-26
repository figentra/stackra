/**
 * Stackra file contract:
 * Purpose: `ApprovalRequest`, one agent tool call as the approval resolver sees it: the action key, its permission's
 *          risk level and effect tags, the recipient count of a send, whether it deletes, and the answers of the
 *          earlier gates (IAM, entitlement and flag, the live environment), and the roles, record and data class the
 *          permission matrix narrows by.
 * Boundary: a type only. The gateway fills it from the manifest's tool row and the pipeline's checks; the resolver
 *           decides nothing about IAM itself, it only orders the answers. `permitted` is the human's grants intersected
 *           with the agent's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decisions 2, 8 and 10; consequences: the fixed order); ADR 0099 (risk and effect tags);
 *                     ADR 0359 (decision 3: live configuration is read-only).
 */

import type { RecordScope } from "#contracts/types/record-scope.type";

/** One tool call to decide. */
export interface ApprovalRequest {
  /** The action key (`orders.order.cancel@1`). */
  readonly action: string;

  /** The permission's risk level, `L0` to `L4`. */
  readonly risk: string;

  /** The action's effect tags (`financial`, `external-communication`, `bulk`, `irreversible`). */
  readonly tags: readonly string[];

  /** How many recipients a send reaches. */
  readonly recipients?: number;

  /** Whether the call deletes, soft deletes included. */
  readonly deletes?: boolean;

  /** Whether IAM allows the call: the human's grants intersected with the agent's. */
  readonly permitted: boolean;

  /** Whether the entitlement and the flag allow the call. */
  readonly entitled: boolean;

  /** Whether the call changes structural configuration on a live tenant, which only a promotion may do. */
  readonly liveConfiguration?: boolean;

  /** The roles the human holds where the call acts, which matrix rows narrow by. */
  readonly roles?: readonly string[];

  /** The record the call works in (a matter), which matrix rows narrow by. */
  readonly record?: RecordScope;

  /** The most restricted data class the call touches, which matrix rows narrow by. */
  readonly dataClass?: string;
}
