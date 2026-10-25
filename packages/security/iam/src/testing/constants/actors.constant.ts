/**
 * Stackra file contract:
 * Purpose: `actors`, the callers a test runs an action, a query or a policy as: a customer, a staff member, a service
 *          (optionally acting for someone), a job, the system and an anonymous visitor.
 * Boundary: test code only. Each call returns a new frozen `Actor`; the defaults are fixed, well-formed public ids, so
 *           two `actors.customer()` calls are the same person. A user id passed in must be a user's public id
 *           (`usr_…`). No actor carries a scope, so a call through the pipeline acts at the root.
 * Runtime: node
 * Governing contract: ADR 0098 (decisions 6 and 7: the actor model); ADR 0269 (decision 3: domain helpers in the
 *                     owning package's `./testing`); the template's tests (`actors.customer(order.customerId)`).
 */
import { type Actor, ActorKind, type PublicId, Realm } from "@stackra/contracts";

/** A user actor, so `.id` is a user's public id. */
type UserActor = Extract<Actor, { readonly kind: typeof ActorKind.User }>;

/** Any other actor. */
type OtherActor = Exclude<Actor, UserActor>;

/** The default customer. */
const CUSTOMER_ID = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1";

/** The default staff member. */
const STAFF_ID = "usr_01j9z3k4m5n6p7q8r9s0t1v2s1";

/** The user id `id` or the default, checked. */
function userId(id: string | undefined, fallback: PublicId<"usr">): PublicId<"usr"> {
  const value = id ?? fallback;
  if (!value.startsWith("usr_"))
    throw new TypeError(`actors: "${value}" is not a user's public id (usr_…)`);
  return value as PublicId<"usr">;
}

/**
 * The test callers.
 *
 * @example
 * await run(CancelOrderAction, { orderId }, { as: actors.customer(order.customerId) });
 * actors.service("notifications", { onBehalfOf: actors.customer(order.customerId) });
 */
export const actors = Object.freeze({
  /**
   * A tenant's customer.
   *
   * @throws TypeError when `id` is not a user's public id.
   */
  customer: (id?: string): UserActor =>
    Object.freeze({ kind: ActorKind.User, id: userId(id, CUSTOMER_ID), realm: Realm.Customer }),

  /**
   * A tenant's staff member.
   *
   * @throws TypeError when `id` is not a user's public id.
   */
  staff: (id?: string): UserActor =>
    Object.freeze({ kind: ActorKind.User, id: userId(id, STAFF_ID), realm: Realm.Tenant }),

  /** Another service by its name, acting for no one or for `onBehalfOf`. */
  service: (name: string, options: { readonly onBehalfOf?: Actor } = {}): OtherActor =>
    Object.freeze({
      kind: ActorKind.Service,
      id: `svc_${name}` as PublicId,
      ...(options.onBehalfOf === undefined ? {} : { onBehalfOf: options.onBehalfOf }),
    }),

  /** A queued or scheduled run. */
  job: (): OtherActor =>
    Object.freeze({ kind: ActorKind.Job, id: "job_01j9z3k4m5n6p7q8r9s0t1v2j1" as PublicId }),

  /** The platform itself. */
  system: (): OtherActor =>
    Object.freeze({ kind: ActorKind.System, id: "sys_01j9z3k4m5n6p7q8r9s0t1v2y1" as PublicId }),

  /** A visitor without a session. */
  anonymous: (): OtherActor =>
    Object.freeze({ kind: ActorKind.Anonymous, id: "anon_01j9z3k4m5n6p7q8r9s0t1v2a1" as PublicId }),
});
