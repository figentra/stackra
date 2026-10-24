/**
 * Stackra file contract:
 * Purpose: `CallDescriptor`, what the pipeline tells a step's port about one call: the class, its identity, the
 *          permission and risk gen derived, the caller, the tenant and the API area.
 * Boundary: a type only; the pipeline builds it once per call and hands the same frozen object to every port. It
 *           carries no input and no record: a step that needs a record gets it as its own argument.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: the fixed order); ADR 0136 (decision 1: the handler context); ADR 0294
 *                     (decision 20: derived identities).
 */
import type { AnyClass } from "@stackra/container";
import type { Actor, ApiArea, PublicId } from "@stackra/contracts";

/** One call of an action or a query, as every pipeline port sees it. */
export interface CallDescriptor {
  /** The call's id, shared by its audit entry, its log lines and `RequestContext.current()`. */
  readonly callId: string;

  /** The action or query class. */
  readonly type: AnyClass;

  /** `action` or `query`. */
  readonly kind: "action" | "query";

  /** The locked identity `<module>.<model>.<verb>@<major>` gen registered, else the written key (`order.create`). */
  readonly key: string;

  /** The derived permission (`orders.order.create`), when gen registered one. */
  readonly permission?: string;

  /** The permission's risk (`L0` to `L4`), when gen registered one. */
  readonly risk?: string;

  /** Who is calling. */
  readonly actor: Actor;

  /** The tenant the call acts in; absent for a platform call. */
  readonly tenantId?: PublicId;

  /** The API area the call arrived on. */
  readonly area: ApiArea;
}
