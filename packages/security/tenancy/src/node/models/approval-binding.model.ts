/**
 * Stackra file contract:
 * Purpose: `ApprovalBinding`, the persisted record of a parked call that `@stackra/actions`' approval stage writes in the
 *          service that owns the action: the approval id, the requester with the whole `onBehalfOf` chain, the action
 *          key, the hash of the validated input, the requester's assurance, when it was requested and when it expires,
 *          and the requirement.
 * Boundary: data and indexes. Key `tenancy.approval_binding`, table `tenancy.approval_bindings` (the package's Postgres
 *           schema), public ids `apr_…` (the approval id). Tenant-owned through `BelongsToTenant` with the forced
 *           equality policy, so a binding of another tenant is invisible; insert-only by trait and by revoking UPDATE, so
 *           nothing edits a stored binding and `PruneApprovalBindingsAction` is the only delete. It is the only source of
 *           who, where, what and when for an execution (B1): the store of requests supplies status, votes and the
 *           snapshot, never identity. PII: the actor chain (principal ids) and the input hash (an unkeyed SHA-256 of
 *           low-entropy input, so it never leaves this table, the audit trail and the owning service) are personal
 *           data of the owning service and belong in its PII table. The assurance is flattened into three columns so
 *           its instant keeps its type. Its string and number fields carry no `@Str` or `@Int`: tenancy does not depend on @stackra/validation (the lead's
 *           decision, STA-1724), and the column lengths are the migration's. The ORM loads rows without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0509 (the binding, B1, N7); ADR 0294 (decisions 4, 20 and 27); ADR 0321 and 0323 d1
 *                     (`BelongsToTenant` is tenancy's); ADR 0239 (equality on `tenant_id`); ADR 0134.
 */
import type { Actor, AssuranceLevel, ScopeRef } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { AppendOnly, HasPublicId, Index, Model } from "@stackra/model";

import { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";

/** One stored binding; the actor, the scope and the assurance's methods are jsonb or flat columns, ids only. */
@Index(["tenantId", "expiresAt"])
@Index(["expiresAt"])
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class ApprovalBinding extends Model.with(HasPublicId("apr"), BelongsToTenant, AppendOnly) {
  /** The scope node the call acts in; null for a call acting at the tenant itself. */
  scope!: ScopeRef | null;

  /** The requester with the whole `onBehalfOf` chain, ids only. */
  requester!: Actor;

  /** The action key with its version. */
  key!: string;

  /** SHA-256 of the action key and the validated input. */
  inputHash!: string;

  /** The authentication methods references of the requester's token; null when the call had no assurance. */
  assuranceAmr!: string[] | null;

  /** The strongest assurance level those methods reach; null when none is mapped. */
  assuranceLevel!: AssuranceLevel | null;

  /** When the requester last authenticated; null when the token did not say. */
  assuranceAuthTime!: Date | null;

  /** When the call was requested, by the owning service's clock. */
  requestedAt!: Date;

  /** When the request stops accepting votes, by the owning service's clock. */
  expiresAt!: Date;

  /** Distinct approvers needed besides the requester. */
  approvals!: number;

  /** The permission each approver holds; null when only the tenant's rules parked the call. */
  permission!: string | null;

  /** The assurance level an approver's session must reach; null when none is required. */
  approverLevel!: AssuranceLevel | null;

  /** Whether the person an agent acts for must confirm. */
  confirm!: boolean;

  /** How the request executes: `on_grant` or `on_resubmit`. */
  execute!: string;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `Repository.insert` may leave out the tenant the
// trait fills; remove it once gen writes the entity files (STA-339).
/** Marks the `ApprovalBinding` fields the model fills itself (`[OptionalProps]`). */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface ApprovalBinding {
  /** The fields an insert may leave out: trait-filled columns. */
  [OptionalProps]?: "tenantId";
}
