/**
 * Stackra file contract:
 * Purpose: `ActionPermissionRow`, one row of the AI action permission matrix: the action key it covers, narrowed by
 *          role, record and data class, with its state and, for after approval, the approver rule.
 * Boundary: a type only. Rows are rule-set data (`rule-set:os:ai-action-permissions`), seeded per product
 *           (`seed-pack:juristra`, Academorix's nine rows) and edited by the tenant; this package only matches them. The
 *           most specific row wins: a record id over a record kind, then a role, then a data class.
 * Runtime: isomorphic
 * Governing contract: X2-12, J2-6 and A2-24; R3-SO-02 (`{ seatKind, notRequester, stepUp }` from the rule set).
 */
import type { ApproverRule } from "@stackra/actions/contracts";

import type { ActionPermission } from "#core/enums/action-permission.enum";
import type { RecordScope } from "#contracts/types/record-scope.type";

/** One matrix row. */
export interface ActionPermissionRow {
  /** The action key it covers (`legal.claim.file@1`). */
  readonly action: string;

  /** The state the row sets. */
  readonly state: ActionPermission;

  /** The role it applies to; every role when absent. */
  readonly role?: string;

  /** The record kind, or one record, it applies to; every record when absent. */
  readonly record?: RecordScope;

  /** The data class it applies to; every class when absent. */
  readonly dataClass?: string;

  /** Who may approve, for `after_approval` (and for a floor hit on this action). */
  readonly approver?: ApproverRule;
}
