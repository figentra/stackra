/**
 * Stackra file contract:
 * Purpose: the `ApprovalGate` port: the store side of the approval step of the action pipeline. `decide` reads the
 *          tenant's rules and may add to the declared requirement, `park` writes the request, `find` reads one,
 *          `begin` moves a granted request to `executing`, and `settle` records how the execution ended.
 * Boundary: an abstract class that is its own token, keyed `actions.ApprovalGate`. The pipeline, not the driver,
 *           compares a request with the call (`verifyApproval`) and enforces `max(declared, decided)`, so a driver
 *           that answers "no approval" for a declared call cannot let it through. `begin` and `settle` are
 *           compare-and-set (`granted → executing`, `executing → executed | failed`), and `begin` also answers true
 *           for a request already `executing` under the same key, so an execution retry is safe. The step runs only
 *           when a gate is bound; an action that declares `approval` fails closed with none bound, with
 *           `OpenApprovalGateDriver`, or with no `ApprovalBindingStore`. Actions only; a query is never parked. A leaf
 *           file.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (the port split); ADR 0098 (decision 3: approval before idempotency); ADR 0099
 *                     (decision 4); ADR 0360; ADR 0331; ADR 0397 as amended (STA-813); STA-1724 FR-005, FR-007, FR-012,
 *                     FR-021.
 */
import { Port } from "@stackra/contracts";

import type { ApprovalDraft } from "#contracts/types/approval-draft.type";
import type { ApprovalOutcome } from "#contracts/types/approval-outcome.type";
import type { ApprovalRecord } from "#contracts/types/approval-record.type";
import type { ApprovalRequirement } from "#contracts/types/approval-requirement.type";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Decides, parks, finds and settles approval requests.
 *
 * @example
 * export class TaskApprovalGateDriver extends Driver(ApprovalGate) {
 *   async decide(call: CallDescriptor, input: unknown, declared: ApprovalRequirement | undefined) {
 *     return (await this.rules.needsApproval(call, input)) ? { approvals: 1, expiresAfter: "72h" } : undefined;
 *   }
 *   async park(draft: ApprovalDraft): Promise<void> {
 *     await this.requests.insert(draft); // refuses `approval_pending_limit` beyond its cap
 *   }
 *   // find, begin and settle read and compare-and-set the request row
 * }
 */
export abstract class ApprovalGate extends Port {
  /** Type-only port key, so `DriverName<ApprovalGate>` narrows to this port's drivers. */
  declare readonly "~key": "actions.ApprovalGate";

  /**
   * What `call` with `input` needs beyond `declared` (the action's own requirement, when it declared one), or
   * `undefined` when the rules add nothing. It may add and never remove; the pipeline keeps the larger.
   * Reads only: it parks nothing.
   */
  abstract decide(
    call: CallDescriptor,
    input: unknown,
    declared: ApprovalRequirement | undefined,
  ): Promise<ApprovalRequirement | undefined>;

  /**
   * Writes the request for voters, in the pipeline's fresh isolation run after the refusal rolled back.
   *
   * @throws ApprovalPendingLimitError beyond the store's cap of pending requests per requester per action.
   */
  abstract park(draft: ApprovalDraft): Promise<void>;

  /** The request with `approvalId`, or `undefined` when the store has none visible to the caller's tenant. */
  abstract find(approvalId: string): Promise<ApprovalRecord | undefined>;

  /**
   * Moves a `granted` request to `executing` under `executionKey` by compare-and-set. Resolves true when it moved, or
   * when the request is already `executing` under the same key (a retry); false for any other state or key.
   */
  abstract begin(approvalId: string, executionKey: string): Promise<boolean>;

  /**
   * Records how the execution ended, by compare-and-set from `executing`. Resolves true when it settled, false when
   * the request was not `executing`.
   */
  abstract settle(approvalId: string, outcome: ApprovalOutcome): Promise<boolean>;
}
