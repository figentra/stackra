/**
 * Stackra file contract:
 * Purpose: `MemoryApprovalGateDriver`, the "memory" `ApprovalGate` with the store's rules: the FR-021 states with
 *          compare-and-set, `approve` (approver permission, `approverRefusal` and `actorsSharePerson`, one vote per
 *          person, operator-access and customer-realm votes refused, the voter's realm recorded, the approver
 *          assurance level and step-up enforced per vote, a re-check of every voter at the final vote), `reject`,
 *          `withdraw`, expiry at every read, the pending cap, and a snapshot deleted at a final state.
 * Boundary: test only, and what the OS driver must match: it passes the port conformance suite. An identity outage
 *           during a vote refuses it (`approval_identity_unavailable`), never counts it. `directory` holds the latest
 *           known state of each approver, which the final re-check reads, so a test can revoke a permission or
 *           deactivate a voter between votes.
 * Runtime: node
 * Governing contract: ADR 0509 (the store's states and approve rules, S3, S6, N4, N6); ADR 0266 (memory first);
 *                     STA-1724 FR-010, FR-015, FR-016, FR-021, FR-022.
 */
import { Driver } from "@stackra/container";
import { actorsSharePerson, ActorKind, AssuranceLevel, Enum, Realm } from "@stackra/contracts";
import { ForbiddenError, isRefusal } from "@stackra/errors";

import { ApprovalStatus } from "#contracts/enums/approval-status.enum";
import { ApproverRefusal } from "#contracts/enums/approver-refusal.enum";
import { ApprovalGate } from "#contracts/ports/approval-gate.port";
import type { ApprovalDraft } from "#contracts/types/approval-draft.type";
import type { ApprovalOutcome } from "#contracts/types/approval-outcome.type";
import type { ApprovalRecord } from "#contracts/types/approval-record.type";
import type { ApprovalRequirement } from "#contracts/types/approval-requirement.type";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { ApprovalConsumedError } from "#core/errors/approval-consumed.error";
import { ApprovalExpiredError } from "#core/errors/approval-expired.error";
import { ApprovalIdentityUnavailableError } from "#core/errors/approval-identity-unavailable.error";
import { ApprovalPendingLimitError } from "#core/errors/approval-pending-limit.error";
import { approverRefusal } from "#core/functions/approver-refusal.function";
import { ApproverRefusedError } from "#testing/errors/approver-refused.error";
import type { MemoryApprovalGateOptions } from "#testing/types/memory-approval-gate-options.type";
import type { MemoryApprover } from "#testing/types/memory-approver.type";

/** A stored request: the record plus what the store keeps beside it. */
interface Row {
  record: { -readonly [K in keyof ApprovalRecord]: ApprovalRecord[K] };
  readonly requirement: ApprovalRequirement;
  readonly expiresAt: Date;
}

/** The states after which the snapshot is deleted. */
const FINAL: ReadonlySet<ApprovalStatus> = new Set([
  ApprovalStatus.Executed,
  ApprovalStatus.Failed,
  ApprovalStatus.Rejected,
  ApprovalStatus.Withdrawn,
  ApprovalStatus.Expired,
  ApprovalStatus.Unknown,
]);

/**
 * Parks, votes on and settles approval requests in memory.
 *
 * @example
 * const gate = new MemoryApprovalGateDriver({ identity, clock });
 * await gate.park(draft);
 * await gate.approve(draft.approvalId, approver); // the final vote grants it
 */
export class MemoryApprovalGateDriver extends Driver(ApprovalGate) {
  /** The latest known state of each approver, by actor id. */
  readonly directory = new Map<string, MemoryApprover>();

  /** The ids of requests granted, in order: what the store would publish as `actions.approval.granted.v1`. */
  readonly granted: string[] = [];

  private readonly rows = new Map<string, Row>();

  private readonly options: MemoryApprovalGateOptions;

  /**
   * @param options - the identity, the clock, the cap and the rules.
   */
  constructor(options: MemoryApprovalGateOptions) {
    super();
    this.options = options;
  }

  /** What the configured rules add; nothing by default. */
  async decide(
    call: CallDescriptor,
    input: unknown,
    declared: ApprovalRequirement | undefined,
  ): Promise<ApprovalRequirement | undefined> {
    return this.options.decide?.(call, input, declared);
  }

  /** Stores a pending request, refusing beyond the cap per requester and action. */
  async park(draft: ApprovalDraft): Promise<void> {
    const cap = this.options.cap ?? 10;
    let pending = 0;
    for (const row of this.rows.values())
      if (
        row.record.status === ApprovalStatus.Pending &&
        row.record.key === draft.key &&
        row.record.requester.id === draft.requester.id
      )
        pending += 1;
    if (pending >= cap) throw ApprovalPendingLimitError.create();
    this.rows.set(draft.approvalId, {
      record: {
        approvalId: draft.approvalId,
        status: ApprovalStatus.Pending,
        key: draft.key,
        scopeId: draft.scopeId,
        ...(draft.scope === undefined ? {} : { scope: draft.scope }),
        requester: draft.requester,
        snapshot: draft.snapshot,
        votes: [],
        execute: draft.execute,
      },
      requirement: draft.requirement,
      expiresAt: draft.expiresAt,
    });
  }

  /** The request, with an overdue pending one reported `expired` (the sweep need not have run). */
  async find(approvalId: string): Promise<ApprovalRecord | undefined> {
    const row = this.rows.get(approvalId);
    if (row === undefined) return undefined;
    this.expireIfOverdue(row);
    return { ...row.record };
  }

  /** `granted → executing` by compare-and-set; true for the same key again. */
  async begin(approvalId: string, executionKey: string): Promise<boolean> {
    const row = this.rows.get(approvalId);
    if (row === undefined) return false;
    if (row.record.status === ApprovalStatus.Executing)
      return row.record.executionKey === executionKey;
    if (row.record.status !== ApprovalStatus.Granted) return false;
    row.record.status = ApprovalStatus.Executing;
    row.record.executionKey = executionKey;
    return true;
  }

  /** `executing → executed | failed` by compare-and-set. */
  async settle(approvalId: string, outcome: ApprovalOutcome): Promise<boolean> {
    const row = this.rows.get(approvalId);
    if (row === undefined || row.record.status !== ApprovalStatus.Executing) return false;
    row.record.status =
      outcome.status === "executed" ? ApprovalStatus.Executed : ApprovalStatus.Failed;
    if (outcome.status === "failed") row.record.failureCode = outcome.code;
    this.finish(row);
    return true;
  }

  /**
   * One approver's vote (the store's approve action).
   *
   * @throws ApprovalExpiredError after the window; ApprovalConsumedError when the request is not pending;
   *         ForbiddenError for an operator-access, customer-realm or non-user vote; ApproverRefusedError for
   *         `approver_not_permitted`, `step_up_required`, `self_approval` or `already_approved`;
   *         ApprovalIdentityUnavailableError when identity cannot answer.
   */
  async approve(approvalId: string, approver: MemoryApprover): Promise<void> {
    const row = this.rows.get(approvalId);
    if (row === undefined) throw ForbiddenError.create();
    if (this.expireIfOverdue(row)) throw ApprovalExpiredError.create();
    if (row.record.status !== ApprovalStatus.Pending) throw ApprovalConsumedError.create();
    if (
      approver.operatorAccess === true ||
      approver.realm === Realm.Customer ||
      approver.actor.kind !== ActorKind.User ||
      approver.active === false
    )
      throw ForbiddenError.create();
    const { permission, approverLevel } = row.requirement;
    if (permission !== undefined && !approver.permissions.includes(permission))
      throw this.refused(ApproverRefusal.ApproverNotPermitted);
    if (approverLevel !== undefined && !this.reaches(approver.assurance, approverLevel))
      throw this.refused(ApproverRefusal.StepUpRequired);
    const refusal = approverRefusal(
      { notRequester: true, stepUp: approverLevel !== undefined },
      { actor: approver.actor, steppedUp: approver.steppedUp },
      row.record.requester,
    );
    if (refusal !== undefined) throw this.refused(refusal);
    if (
      await this.answered(() =>
        actorsSharePerson(this.options.identity, approver.actor, row.record.requester),
      )
    )
      throw this.refused(ApproverRefusal.SelfApproval);
    for (const vote of row.record.votes)
      if (
        await this.answered(() =>
          actorsSharePerson(this.options.identity, approver.actor, vote.voter),
        )
      )
        throw this.refused(ApproverRefusal.AlreadyApproved);
    this.directory.set(approver.actor.id, approver);
    row.record.votes = [
      ...row.record.votes,
      { voter: approver.actor, realm: approver.realm, at: this.options.clock.now() },
    ];
    if (row.record.votes.length >= row.requirement.approvals) await this.grantIfHolds(row);
  }

  /** A pending request ends `rejected`. */
  async reject(approvalId: string, approver: MemoryApprover): Promise<void> {
    const row = this.pendingRow(approvalId);
    if (approver.operatorAccess === true || approver.realm === Realm.Customer)
      throw ForbiddenError.create();
    row.record.status = ApprovalStatus.Rejected;
    this.finish(row);
  }

  /** A pending request ends `withdrawn`; only its requester may. */
  async withdraw(approvalId: string, requester: MemoryApprover["actor"]): Promise<void> {
    const row = this.pendingRow(approvalId);
    if (row.record.requester.id !== requester.id) throw ForbiddenError.create();
    row.record.status = ApprovalStatus.Withdrawn;
    this.finish(row);
  }

  /** The sweep: marks every overdue pending request `expired`. */
  sweep(): void {
    for (const row of this.rows.values()) this.expireIfOverdue(row);
  }

  /** The pending row, refusing otherwise (reject and withdraw act only on `pending`). */
  private pendingRow(approvalId: string): Row {
    const row = this.rows.get(approvalId);
    if (row === undefined) throw ForbiddenError.create();
    if (this.expireIfOverdue(row)) throw ApprovalExpiredError.create();
    if (row.record.status !== ApprovalStatus.Pending) throw ApprovalConsumedError.create();
    return row;
  }

  /** Re-checks every voter at the final vote and grants only if the count still holds (S6). */
  private async grantIfHolds(row: Row): Promise<void> {
    const keep = [];
    for (const vote of row.record.votes) {
      const now = this.directory.get(vote.voter.id);
      const { permission, approverLevel } = row.requirement;
      if (now === undefined || now.active === false) continue;
      if (permission !== undefined && !now.permissions.includes(permission)) continue;
      if (approverLevel !== undefined && !this.reaches(now.assurance, approverLevel)) continue;
      const refusal = approverRefusal(
        { notRequester: true, stepUp: approverLevel !== undefined },
        { actor: now.actor, steppedUp: now.steppedUp },
        row.record.requester,
      );
      if (refusal !== undefined) continue;
      if (
        await this.answered(() =>
          actorsSharePerson(this.options.identity, now.actor, row.record.requester),
        )
      )
        continue;
      keep.push(vote);
    }
    row.record.votes = keep;
    if (keep.length < row.requirement.approvals) return;
    row.record.status = ApprovalStatus.Granted;
    row.record.grantedAt = this.options.clock.now();
    this.granted.push(row.record.approvalId);
  }

  /** Marks an overdue pending request expired; true when it is (now) expired. */
  private expireIfOverdue(row: Row): boolean {
    if (
      row.record.status === ApprovalStatus.Pending &&
      this.options.clock.now().getTime() > row.expiresAt.getTime()
    ) {
      row.record.status = ApprovalStatus.Expired;
      this.finish(row);
    }
    return row.record.status === ApprovalStatus.Expired;
  }

  /** At a final state the snapshot is deleted; ids, key and counts stay (FR-014). */
  private finish(row: Row): void {
    if (FINAL.has(row.record.status)) delete row.record.snapshot;
  }

  private reaches(have: AssuranceLevel | undefined, need: AssuranceLevel): boolean {
    const order = Enum.values(AssuranceLevel);
    return have !== undefined && order.indexOf(have) >= order.indexOf(need);
  }

  private refused(code: ApproverRefusal): ApproverRefusedError {
    return ApproverRefusedError.create({ refusal: code });
  }

  /** An identity read; an outage (a rejection that is not a refusal) refuses the vote, never counts it. */
  private async answered<T>(read: () => Promise<T>): Promise<T> {
    try {
      return await read();
    } catch (error) {
      if (isRefusal(error)) throw error;
      throw ApprovalIdentityUnavailableError.create({}, { cause: error });
    }
  }
}
