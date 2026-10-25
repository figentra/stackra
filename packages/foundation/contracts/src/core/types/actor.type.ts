/**
 * Stackra file contract:
 * Purpose: `Actor`, who is acting in a call: the typed caller every action, query, policy and audit record reads,
 *          with the delegation chain behind it.
 * Boundary: a type only. The action pipeline builds it from the verified credential; code never reads a caller from
 *           a request body. Only a user actor has a realm, so `actor.realm === Realm.Customer` also narrows `id` to a
 *           user's public id.
 * Runtime: isomorphic
 * Governing contract: ADR 0098 (decisions 6 and 7), ADR 0135 (public ids), ADR 0294 (decision 23: `kind`).
 */
import type { ActorKind } from "#core/enums/actor-kind.enum";
import type { Realm } from "#core/enums/realm.enum";
import type { PublicId } from "#core/types/public-id.type";

/**
 * The caller of one invocation. `onBehalfOf` is the actor this one acts for, recursively, ending at the originating
 * principal, so `(actor.onBehalfOf ?? actor)` is the subject of a call an agent or a service makes for someone.
 *
 * @example
 * const subject = actor.onBehalfOf ?? actor;
 * if (subject.realm === Realm.Customer && order.customerId !== subject.id) return Decision.Deny;
 */
export type Actor =
  | {
      readonly kind: typeof ActorKind.User;
      /** The user's public id. */
      readonly id: PublicId<"usr">;
      readonly realm: Realm;
      /** The tenant the call acts in; absent for a platform call. */
      readonly tenantId?: PublicId;
      readonly onBehalfOf?: Actor;
    }
  | {
      readonly kind: Exclude<ActorKind, typeof ActorKind.User>;
      /** The principal's public id: the agent, service, job, webhook source or anonymous visitor. */
      readonly id: PublicId;
      readonly realm?: undefined;
      /** The tenant the call acts in; absent for a platform call. */
      readonly tenantId?: PublicId;
      readonly onBehalfOf?: Actor;
    };
