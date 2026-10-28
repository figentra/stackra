/**
 * Stackra file contract:
 * Purpose: `AuditRecord`, one audited action call as the Postgres audit store keeps it: the `AuditEntry` of
 *          @stackra/actions flattened, with every optional field as `null` so the stored row and the hashed record are
 *          the same value.
 * Boundary: a type in the leaf entry; it imports only types. Ids and codes, never the call's input: `fields` holds what
 *           the handler passed to `ctx.audit`, which never carries a classified value (ADR 0134). The call's tenant is
 *           the row's, set by tenancy's trait, so it is not a field here (R-59).
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 5: every action is audited); ADR 0212 (decision 3: a hash chain); ADR 0465
 *                     (decision 4: an `AuditTrail` store beside the access log); ADR 0456 (the request origin).
 */
import type { Actor, Json } from "@stackra/contracts";

/** One audited action call, flattened for storage and hashing. */
export interface AuditRecord {
  /** The call's id, shared with its log lines and access records. */
  readonly callId: string;

  /** The action's locked key (`orders.order.create@1`). */
  readonly key: string;

  /** The derived permission, or null when gen registered none. */
  readonly permission: string | null;

  /** The permission's risk, `L0` to `L4`, or null. */
  readonly risk: string | null;

  /** The permission's effect tags. */
  readonly effects: readonly string[];

  /** Who called, with the `onBehalfOf` chain, ids only. */
  readonly actor: Actor;

  /** The scope node's public id, or null for a call at the tenant root. */
  readonly scopeId: string | null;

  /** The scope node's path, or null. */
  readonly scopePath: string | null;

  /** The surface the call arrived through (`storefront`, `console`, `api_key`, `agent`), or null for an internal call. */
  readonly originKind: string | null;

  /** The public id of the storefront, API key or agent the call came from, or null. */
  readonly originId: string | null;

  /** `ok`, or `refused`. */
  readonly outcome: "ok" | "refused";

  /** The refusal code of a refused call, or null. */
  readonly code: string | null;

  /** The fields the handler added with `ctx.audit(...)`. */
  readonly fields: Readonly<Record<string, Json>>;

  /** The pipeline clock's reading at the start of the call. */
  readonly at: Date;
}
